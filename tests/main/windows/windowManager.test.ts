import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockIs, appMock, shellMock, browserWindowState } = vi.hoisted(() => {
    const mockIs = {
        dev: false,
        mac: false,
        windows: true,
        linux: false,
    };

    const appMock = {
        quit: vi.fn(),
        on: vi.fn(),
        whenReady: vi.fn().mockResolvedValue(undefined),
        isPackaged: false,
        commandLine: {
            appendSwitch: vi.fn(),
        },
        requestSingleInstanceLock: vi.fn().mockReturnValue(true),
    };

    const shellMock = {
        openExternal: vi.fn(),
    };

    type Listener = (...args: unknown[]) => void;
    const windows: any[] = [];

    const createMockWindow = () => {
        const listeners: Record<string, Listener[]> = {};
        let isVisible = true;
        let isDestroyed = false;

        const on = vi.fn((event: string, handler: Listener) => {
            if (!listeners[event]) listeners[event] = [];
            listeners[event].push(handler);
        });
        const off = (event: string, handler: Listener) => {
            listeners[event] = (listeners[event] ?? []).filter((h) => h !== handler);
        };
        const once = vi.fn((event: string, handler: Listener) => {
            const wrapped: Listener = (...args: unknown[]) => {
                off(event, wrapped);
                handler(...args);
            };
            on(event, wrapped);
        });
        const emit = (event: string, ...args: unknown[]) => {
            [...(listeners[event] ?? [])].forEach((h) => h(...args));
        };

        const windowMock: any = {
            isDestroyed: vi.fn(() => isDestroyed),
            isVisible: vi.fn(() => isVisible),
            webContents: {
                send: vi.fn(),
                id: windows.length + 1,
                setWindowOpenHandler: vi.fn(),
                openDevTools: vi.fn(),
            },
            on,
            once,
            loadURL: vi.fn(),
            loadFile: vi.fn(),
            getPosition: vi.fn(() => [100, 200]),
            getSize: vi.fn(() => [800, 600]),
            show: vi.fn(() => {
                isVisible = true;
                emit("show");
            }),
            hide: vi.fn(() => {
                isVisible = false;
            }),
            focus: vi.fn(),
            close: vi.fn(() => {
                const closeEvent = { preventDefault: vi.fn() };
                emit("close", closeEvent);
                if (closeEvent.preventDefault.mock.calls.length === 0) {
                    isDestroyed = true;
                    emit("closed");
                }
            }),
            destroy: vi.fn(() => {
                isDestroyed = true;
            }),
            __emit: emit,
            __setVisible: (value: boolean) => {
                isVisible = value;
            },
            __setDestroyed: (value: boolean) => {
                isDestroyed = value;
            },
            __resetListeners: () => {
                Object.keys(listeners).forEach((event) => {
                    delete listeners[event];
                });
            },
        };

        return windowMock;
    };

    const resetWindows = () => {
        windows.splice(0, windows.length);
    };

    return {
        mockIs,
        appMock,
        shellMock,
        browserWindowState: {
            windows,
            createMockWindow,
            resetWindows,
        },
    };
});

vi.mock("electron", () => {
    class MockBrowserWindow {
        constructor() {
            const win = browserWindowState.createMockWindow();
            browserWindowState.windows.push(win);
            return win;
        }
        static fromWebContents() {
            return browserWindowState.windows[0] ?? null;
        }
    }

    return {
        BrowserWindow: MockBrowserWindow,
        app: appMock,
        shell: shellMock,
        globalShortcut: {
            register: vi.fn(),
            unregisterAll: vi.fn(),
        },
        ipcMain: {
            handle: vi.fn(),
        },
        Menu: {
            setApplicationMenu: vi.fn(),
        },
        dialog: {
            showOpenDialog: vi.fn(),
        },
    };
});

vi.mock("@electron-toolkit/utils", () => ({
    is: mockIs,
}));

import { WindowManager } from "@/main/windows/windowManager";
import { IWindowRepository } from "@/main/repositories/WindowRepository";
import type { IWindowShortcutManager } from "@/main/windows/windowShortcutManager";

describe("WindowManager", () => {
    let windowManager: WindowManager;
    let mockWindowRepository: IWindowRepository;

    beforeEach(() => {
        vi.clearAllMocks();
        browserWindowState.resetWindows();
        mockIs.dev = false;
        appMock.isPackaged = false;
        delete process.env["ELECTRON_RENDERER_URL"];

        mockWindowRepository = {
            loadWindowColor: vi.fn(),
            saveWindowColor: vi.fn(),
            getWindowPositionAndSize: vi.fn().mockReturnValue({
                pos: { x: 0, y: 0 },
                size: { width: 800, height: 600 },
            }),
            saveWindowPositionAndSize: vi.fn(),
            getImageSettingsWindowPositionAndSize: vi.fn().mockReturnValue({
                pos: { x: 0, y: 0 },
                size: { width: 300, height: 400 },
            }),
            saveImageSettingsWindowPositionAndSize: vi.fn(),
        };
        windowManager = new WindowManager(mockWindowRepository);
    });

    it("openFile sends IPC message if window exists and visible", () => {
        const mainWindow = windowManager.createMainWindow() as any;
        windowManager.openFile("test.png");

        expect(mainWindow.webContents.send).toHaveBeenCalledWith("file:open", {
            filePath: "test.png",
            ext: ".png",
        });
    });

    it("openFile pends file if window not ready, and sends it when ready", () => {
        windowManager.openFile("test.png");
        const mainWindow = windowManager.createMainWindow() as any;

        mainWindow.__emit("ready-to-show");

        expect(mainWindow.show).toHaveBeenCalled();
        expect(mainWindow.webContents.send).toHaveBeenCalledWith("file:open", {
            filePath: "test.png",
            ext: ".png",
        });
    });

    it("openFile pends file if window exists but hidden, and sends it when shown", () => {
        const mainWindow = windowManager.createMainWindow() as any;
        mainWindow.__setVisible(false);

        windowManager.openFile("hidden.png");
        expect(mainWindow.webContents.send).not.toHaveBeenCalledWith("file:open", {
            filePath: "hidden.png",
            ext: ".png",
        });

        mainWindow.__setVisible(true);
        mainWindow.__emit("show");

        expect(mainWindow.webContents.send).toHaveBeenCalledWith("file:open", {
            filePath: "hidden.png",
            ext: ".png",
        });
    });

    it("registers external link handler for main window", () => {
        const mainWindow = windowManager.createMainWindow() as any;
        const handler = mainWindow.webContents.setWindowOpenHandler.mock.calls[0][0];

        expect(handler({ url: "https://example.com" })).toEqual({ action: "deny" });
        expect(shellMock.openExternal).toHaveBeenCalledWith("https://example.com");
        expect(handler({ url: "file:///tmp/a.txt" })).toEqual({ action: "allow" });
    });

    it("toggles image settings window visibility and persists bounds when hidden", () => {
        expect(windowManager.toggleImageSettingsWindow()).toBe(true);
        const settingsWindow = windowManager.getImageSettingsWindow() as any;
        settingsWindow.__setVisible(true);

        expect(windowManager.toggleImageSettingsWindow()).toBe(false);
        expect(settingsWindow.hide).toHaveBeenCalledTimes(1);
        expect(
            mockWindowRepository.saveImageSettingsWindowPositionAndSize
        ).toHaveBeenCalledWith([100, 200], [800, 600]);

        settingsWindow.__setVisible(false);
        expect(windowManager.toggleImageSettingsWindow()).toBe(true);
        expect(settingsWindow.show).toHaveBeenCalled();
        expect(settingsWindow.focus).toHaveBeenCalled();
    });

    it("prevents image settings close while app is running", () => {
        windowManager.createMainWindow();
        windowManager.createImageSettingsWindow();
        const settingsWindow = windowManager.getImageSettingsWindow() as any;
        const event = { preventDefault: vi.fn() };

        settingsWindow.__emit("close", event);

        expect(event.preventDefault).toHaveBeenCalledTimes(1);
        expect(settingsWindow.hide).toHaveBeenCalledTimes(1);
    });

    it("allows image settings close during app quit", () => {
        windowManager.createMainWindow();
        windowManager.createImageSettingsWindow();
        windowManager.willQuit();
        const settingsWindow = windowManager.getImageSettingsWindow() as any;
        const event = { preventDefault: vi.fn() };

        settingsWindow.__emit("close", event);

        expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it("closes all windows and destroys image settings window", () => {
        const mainWindow = windowManager.createMainWindow() as any;
        windowManager.createImageSettingsWindow();
        const settingsWindow = windowManager.getImageSettingsWindow() as any;

        windowManager.closeAllWindows();

        expect(settingsWindow.destroy).toHaveBeenCalledTimes(1);
        expect(mainWindow.close).toHaveBeenCalledTimes(1);
    });

    it("delegates shortcut registration to injected manager", () => {
        const shortcutManager: IWindowShortcutManager = {
            registerToggleImageSettings: vi.fn(),
            unregisterAll: vi.fn(),
        };
        windowManager = new WindowManager(mockWindowRepository, shortcutManager);

        windowManager.registerShortcuts();

        expect(shortcutManager.registerToggleImageSettings).toHaveBeenCalledTimes(
            1
        );
    });

    it("delegates shortcut unregistration to injected manager", () => {
        const shortcutManager: IWindowShortcutManager = {
            registerToggleImageSettings: vi.fn(),
            unregisterAll: vi.fn(),
        };
        windowManager = new WindowManager(mockWindowRepository, shortcutManager);

        windowManager.unregisterShortcuts();

        expect(shortcutManager.unregisterAll).toHaveBeenCalledTimes(1);
    });

    it("cleanup unregisters shortcuts and closes all windows", () => {
        const shortcutManager: IWindowShortcutManager = {
            registerToggleImageSettings: vi.fn(),
            unregisterAll: vi.fn(),
        };
        windowManager = new WindowManager(mockWindowRepository, shortcutManager);
        const closeAllSpy = vi.spyOn(windowManager, "closeAllWindows");

        windowManager.cleanup();

        expect(shortcutManager.unregisterAll).toHaveBeenCalledTimes(1);
        expect(closeAllSpy).toHaveBeenCalledTimes(1);
    });

    it("opens DevTools only in local development mode", () => {
        const mainWindow = windowManager.createMainWindow() as any;
        mockIs.dev = true;
        process.env["ELECTRON_RENDERER_URL"] = "http://localhost:5173";

        windowManager.openDevTools(mainWindow, false);
        expect(mainWindow.webContents.openDevTools).toHaveBeenCalledWith({
            mode: "detach",
        });

        mainWindow.webContents.openDevTools.mockClear();
        appMock.isPackaged = true;
        windowManager.openDevTools(mainWindow, false);
        expect(mainWindow.webContents.openDevTools).not.toHaveBeenCalled();
    });

    it("launchMainWindow skips splash when configured", async () => {
        const window = await windowManager.launchMainWindow({ skipSplash: true });

        expect(window).toBe(windowManager.getMainWindow());
        expect(browserWindowState.windows).toHaveLength(1);
    });

    it("launchMainWindow waits for splash ready event", async () => {
        const launchPromise = windowManager.launchMainWindow();
        const splashWindow = browserWindowState.windows[0];

        expect(splashWindow).toBeTruthy();
        splashWindow.__emit("ready-to-show");

        const mainWindow = await launchPromise;
        expect(splashWindow.show).toHaveBeenCalledTimes(1);
        expect(mainWindow).toBe(windowManager.getMainWindow());
        expect(browserWindowState.windows).toHaveLength(2);
    });
});
