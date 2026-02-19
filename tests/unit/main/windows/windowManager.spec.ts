import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const {
    mockIs,
    mockPlatform,
    appMock,
    shellMock,
    dialogMock,
    browserWindowState,
} =
    vi.hoisted(() => {
        const mockIs = {
            dev: false,
        };
        const mockPlatform = {
            isMacOS: false,
            isWindows: true,
            isLinux: false,
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

        const dialogMock = {
            showOpenDialog: vi.fn(),
            showMessageBoxSync: vi.fn().mockReturnValue(1),
        };

        type Listener = (...args: unknown[]) => void;
        const windows: any[] = [];
        const windowOptionsHistory: unknown[] = [];

        const createMockWindow = (options?: unknown) => {
            const listeners: Record<string, Listener[]> = {};
            let isVisible = true;
            let isDestroyed = false;

            const on = vi.fn((event: string, handler: Listener) => {
                if (!listeners[event]) listeners[event] = [];
                listeners[event].push(handler);
            });
            const off = (event: string, handler: Listener) => {
                listeners[event] = (listeners[event] ?? []).filter(
                    (h) => h !== handler
                );
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
                isMaximized: vi.fn(() => false),
                maximize: vi.fn(),
                setResizable: vi.fn(),
                getNormalBounds: vi.fn(() => ({
                    x: 100,
                    y: 200,
                    width: 800,
                    height: 600,
                })),
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
                __constructorOptions: options,
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
            windowOptionsHistory.splice(0, windowOptionsHistory.length);
        };

        return {
            mockIs,
            mockPlatform,
            appMock,
            shellMock,
            dialogMock,
            browserWindowState: {
                windows,
                createMockWindow,
                resetWindows,
                windowOptionsHistory,
            },
        };
    });

vi.mock("electron", () => {
    class MockBrowserWindow {
        constructor(options?: unknown) {
            const win = browserWindowState.createMockWindow(options);
            browserWindowState.windows.push(win);
            browserWindowState.windowOptionsHistory.push(options);
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
        dialog: dialogMock,
    };
});

vi.mock("@electron-toolkit/utils", () => ({
    is: mockIs,
    platform: mockPlatform,
}));
vi.mock("@/i18n/mainI18n", () => ({
    tUnsavedChanges: (key: string) => key,
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
        mockPlatform.isMacOS = false;
        mockPlatform.isWindows = true;
        mockPlatform.isLinux = false;
        appMock.isPackaged = false;
        delete process.env["ELECTRON_RENDERER_URL"];

        mockWindowRepository = {
            loadWindowColor: vi.fn(),
            saveWindowColor: vi.fn(),
            getWindowPositionAndSize: vi.fn().mockReturnValue({
                pos: { x: 0, y: 0 },
                size: { width: 800, height: 600 },
                isMaximized: false,
            }),
            saveWindowPositionAndSize: vi.fn(),
            getImageSettingsWindowPositionAndSize: vi.fn().mockReturnValue({
                pos: { x: 0, y: 0 },
                size: { width: 300, height: 400 },
            }),
            saveImageSettingsWindowPositionAndSize: vi.fn(),
            getDimensionSettingsWindowPositionAndSize: vi.fn().mockReturnValue({
                pos: { x: 40, y: 40 },
                size: { width: 460, height: 560 },
            }),
            saveDimensionSettingsWindowPositionAndSize: vi.fn(),
        };
        windowManager = new WindowManager(mockWindowRepository);
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    it("creates windows with resize-friendly options on Windows", () => {
        windowManager.createMainWindow();
        windowManager.createImageSettingsWindow();

        const mainOptions = browserWindowState.windowOptionsHistory[0] as Record<
            string,
            unknown
        >;
        const settingsOptions = browserWindowState.windowOptionsHistory[1] as Record<
            string,
            unknown
        >;

        expect(mainOptions.frame).toBe(false);
        expect(mainOptions.transparent).toBe(true);
        expect(mainOptions.resizable).toBe(true);
        expect(mainOptions.thickFrame).toBe(true);
        expect(
            (mainOptions.webPreferences as Record<string, unknown>).sandbox
        ).toBe(true);
        expect(mainOptions).not.toHaveProperty("titleBarStyle");

        expect(settingsOptions.frame).toBe(false);
        expect(settingsOptions.transparent).toBe(true);
        expect(settingsOptions.resizable).toBe(true);
        expect(settingsOptions.minWidth).toBe(400);
        expect(settingsOptions.minHeight).toBe(500);
        expect(settingsOptions.thickFrame).toBe(true);
        expect(
            (settingsOptions.webPreferences as Record<string, unknown>).sandbox
        ).toBe(true);
        expect(settingsOptions).not.toHaveProperty("titleBarStyle");
    });

    it("creates windows with macOS title bar style and without Windows thick frame", () => {
        mockPlatform.isMacOS = true;
        mockPlatform.isWindows = false;

        windowManager.createMainWindow();
        windowManager.createImageSettingsWindow();
        windowManager.createDimensionSettingsWindow();

        const mainOptions = browserWindowState.windowOptionsHistory[0] as Record<
            string,
            unknown
        >;
        const imageOptions = browserWindowState.windowOptionsHistory[1] as Record<
            string,
            unknown
        >;
        const dimensionOptions =
            browserWindowState.windowOptionsHistory[2] as Record<string, unknown>;

        expect(mainOptions.titleBarStyle).toBe("hidden");
        expect(mainOptions).not.toHaveProperty("thickFrame");
        expect(imageOptions.titleBarStyle).toBe("hidden");
        expect(imageOptions).not.toHaveProperty("thickFrame");
        expect(dimensionOptions.titleBarStyle).toBe("hidden");
        expect(dimensionOptions).not.toHaveProperty("thickFrame");
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
        const setWindowOpenHandler = vi.mocked(
            mainWindow.webContents.setWindowOpenHandler
        );
        expect(setWindowOpenHandler).toHaveBeenCalledWith(expect.any(Function));
        const [handler] = setWindowOpenHandler.mock.lastCall ?? [];
        if (typeof handler !== "function") {
            throw new Error("window open handler should be registered");
        }

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

    it("toggles dimension settings window visibility and persists bounds when hidden", () => {
        expect(windowManager.toggleDimensionSettingsWindow()).toBe(true);
        const settingsWindow = windowManager.getDimensionSettingsWindow() as any;
        settingsWindow.__setVisible(true);

        expect(windowManager.toggleDimensionSettingsWindow()).toBe(false);
        expect(settingsWindow.hide).toHaveBeenCalledTimes(1);
        expect(
            mockWindowRepository.saveDimensionSettingsWindowPositionAndSize
        ).toHaveBeenCalledWith([100, 200], [800, 600]);
        expect(settingsWindow.webContents.send).toHaveBeenCalledWith(
            "interactionMode:updated",
            "default"
        );

        settingsWindow.__setVisible(false);
        expect(windowManager.toggleDimensionSettingsWindow()).toBe(true);
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

    it("prevents dimension settings close while app is running and resets interaction mode", () => {
        windowManager.createMainWindow();
        windowManager.createDimensionSettingsWindow();
        const settingsWindow = windowManager.getDimensionSettingsWindow() as any;
        const event = { preventDefault: vi.fn() };

        settingsWindow.__emit("close", event);

        expect(event.preventDefault).toHaveBeenCalledTimes(1);
        expect(settingsWindow.hide).toHaveBeenCalledTimes(1);
        expect(settingsWindow.webContents.send).toHaveBeenCalledWith(
            "interactionMode:updated",
            "default"
        );
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

    it("closes all windows and destroys dimension settings window", () => {
        const mainWindow = windowManager.createMainWindow() as any;
        windowManager.createDimensionSettingsWindow();
        const dimensionWindow = windowManager.getDimensionSettingsWindow() as any;

        windowManager.closeAllWindows();

        expect(dimensionWindow.destroy).toHaveBeenCalledTimes(1);
        expect(windowManager.getDimensionSettingsWindow()).toBeNull();
        expect(mainWindow.close).toHaveBeenCalledTimes(1);
    });

    it("delegates shortcut registration to injected manager", () => {
        const shortcutManager: IWindowShortcutManager = {
            registerToggleClickThroughMode: vi.fn(),
            unregisterAll: vi.fn(),
        };
        windowManager = new WindowManager(mockWindowRepository, shortcutManager);

        windowManager.registerShortcuts();

        expect(
            shortcutManager.registerToggleClickThroughMode
        ).toHaveBeenCalledTimes(1);
    });

    it("sends click-through shortcut event to main window when global shortcut fires", () => {
        let registeredCallback: (() => void) | null = null;
        const shortcutManager: IWindowShortcutManager = {
            registerToggleClickThroughMode: vi.fn((callback: () => void) => {
                registeredCallback = callback;
            }),
            unregisterAll: vi.fn(),
        };
        windowManager = new WindowManager(mockWindowRepository, shortcutManager);
        const mainWindow = windowManager.createMainWindow() as any;

        windowManager.registerShortcuts();
        expect(registeredCallback).toBeTypeOf("function");

        if (typeof registeredCallback !== "function") {
            throw new Error("registeredCallback should be set");
        }
        (registeredCallback as () => void)();

        expect(mainWindow.webContents.send).toHaveBeenCalledWith(
            "clickThrough:shortcutTriggered"
        );
    });

    it("does not send click-through shortcut event when main window is missing or destroyed", () => {
        let registeredCallback: (() => void) | null = null;
        const shortcutManager: IWindowShortcutManager = {
            registerToggleClickThroughMode: vi.fn((callback: () => void) => {
                registeredCallback = callback;
            }),
            unregisterAll: vi.fn(),
        };
        windowManager = new WindowManager(mockWindowRepository, shortcutManager);
        windowManager.registerShortcuts();

        if (typeof registeredCallback !== "function") {
            throw new Error("registeredCallback should be set");
        }

        (registeredCallback as () => void)();

        const mainWindow = windowManager.createMainWindow() as any;
        mainWindow.__setDestroyed(true);
        (registeredCallback as () => void)();

        expect(mainWindow.webContents.send).not.toHaveBeenCalled();
    });

    it("delegates shortcut unregistration to injected manager", () => {
        const shortcutManager: IWindowShortcutManager = {
            registerToggleClickThroughMode: vi.fn(),
            unregisterAll: vi.fn(),
        };
        windowManager = new WindowManager(mockWindowRepository, shortcutManager);

        windowManager.unregisterShortcuts();

        expect(shortcutManager.unregisterAll).toHaveBeenCalledTimes(1);
    });

    it("cleanup unregisters shortcuts and closes all windows", () => {
        const shortcutManager: IWindowShortcutManager = {
            registerToggleClickThroughMode: vi.fn(),
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

    it("uses loadURL for splash and main windows in dev mode", async () => {
        mockIs.dev = true;
        process.env["ELECTRON_RENDERER_URL"] = "http://localhost:5173";

        const launchPromise = windowManager.launchMainWindow();
        const splashWindow = browserWindowState.windows[0];

        expect(splashWindow.loadURL).toHaveBeenCalledWith(
            "http://localhost:5173/splash/"
        );

        splashWindow.__emit("ready-to-show");
        const mainWindow = await launchPromise;

        expect(mainWindow.loadURL).toHaveBeenCalledWith(
            "http://localhost:5173/main-window/"
        );
    });

    it("delays main window show while splash minimum duration is not reached", async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2024-01-01T00:00:00.000Z"));
        vi.mocked(mockWindowRepository.getWindowPositionAndSize).mockReturnValue({
            pos: { x: 0, y: 0 },
            size: { width: 800, height: 600 },
            isMaximized: true,
        });

        const launchPromise = windowManager.launchMainWindow();
        const splashWindow = browserWindowState.windows[0];
        splashWindow.__emit("ready-to-show");
        const mainWindow = (await launchPromise) as any;

        vi.setSystemTime(new Date("2024-01-01T00:00:00.500Z"));
        mainWindow.__emit("ready-to-show");

        expect(mainWindow.show).not.toHaveBeenCalled();
        vi.advanceTimersByTime(1000);

        expect(mainWindow.maximize).toHaveBeenCalledTimes(1);
        expect(mainWindow.setResizable).toHaveBeenCalledWith(true);
        expect(mainWindow.show).toHaveBeenCalledTimes(1);
        expect(splashWindow.destroy).toHaveBeenCalledTimes(1);
    });

    it("shows main window after splash delay without maximizing when state is not maximized", async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2024-01-01T00:00:00.000Z"));
        vi.mocked(mockWindowRepository.getWindowPositionAndSize).mockReturnValue({
            pos: { x: 0, y: 0 },
            size: { width: 800, height: 600 },
            isMaximized: false,
        });

        const launchPromise = windowManager.launchMainWindow();
        const splashWindow = browserWindowState.windows[0];
        splashWindow.__emit("ready-to-show");
        const mainWindow = (await launchPromise) as any;

        vi.setSystemTime(new Date("2024-01-01T00:00:00.700Z"));
        mainWindow.__emit("ready-to-show");
        vi.advanceTimersByTime(800);

        expect(mainWindow.maximize).not.toHaveBeenCalled();
        expect(mainWindow.setResizable).not.toHaveBeenCalled();
        expect(mainWindow.show).toHaveBeenCalledTimes(1);
        expect(splashWindow.destroy).toHaveBeenCalledTimes(1);
    });

    it("destroySplashWindow destroys splash only when available", async () => {
        const launchPromise = windowManager.launchMainWindow();
        const splashWindow = browserWindowState.windows[0];
        splashWindow.__emit("ready-to-show");
        await launchPromise;

        windowManager.destroySplashWindow();
        windowManager.destroySplashWindow();

        expect(splashWindow.destroy).toHaveBeenCalledTimes(1);
    });

    it("persists normal bounds and isMaximized=true when closing maximized window", () => {
        const mainWindow = windowManager.createMainWindow() as any;

        // Simulate maximized state
        mainWindow.isMaximized.mockReturnValue(true);
        mainWindow.getNormalBounds.mockReturnValue({
            x: 50,
            y: 50,
            width: 900,
            height: 700,
        });

        // Trigger close event properly
        const event = { preventDefault: vi.fn() };
        mainWindow.__emit("close", event);

        expect(
            mockWindowRepository.saveWindowPositionAndSize
        ).toHaveBeenCalledWith([50, 50], [900, 700], true);
    });

    it("restores maximized state on creation", () => {
        // Mock repository to return isMaximized=true
        vi.mocked(mockWindowRepository.getWindowPositionAndSize).mockReturnValue({
            pos: { x: 0, y: 0 },
            size: { width: 800, height: 600 },
            isMaximized: true,
        });

        const mainWindow = windowManager.createMainWindow() as any;
        // Trigger ready-to-show to execute restore logic
        mainWindow.__emit("ready-to-show");

        expect(mainWindow.maximize).toHaveBeenCalled();
        expect(mainWindow.setResizable).toHaveBeenCalledWith(true);
        expect(mainWindow.show).toHaveBeenCalled();
    });

    it("uses loadURL for image and dimension settings windows in dev mode", () => {
        mockIs.dev = true;
        process.env["ELECTRON_RENDERER_URL"] = "http://localhost:5173";

        const imageWindow = windowManager.createImageSettingsWindow() as any;
        const dimensionWindow = windowManager.createDimensionSettingsWindow() as any;

        expect(imageWindow.loadURL).toHaveBeenCalledWith(
            "http://localhost:5173/image-settings/"
        );
        expect(dimensionWindow.loadURL).toHaveBeenCalledWith(
            "http://localhost:5173/dimension-settings/"
        );
    });

    it("focuses existing image and dimension settings windows when create is called again", () => {
        const imageWindow = windowManager.createImageSettingsWindow() as any;
        const dimensionWindow = windowManager.createDimensionSettingsWindow() as any;

        const imageWindowAgain = windowManager.createImageSettingsWindow();
        const dimensionWindowAgain = windowManager.createDimensionSettingsWindow();

        expect(imageWindowAgain).toBe(imageWindow);
        expect(dimensionWindowAgain).toBe(dimensionWindow);
        expect(imageWindow.focus).toHaveBeenCalledTimes(1);
        expect(dimensionWindow.focus).toHaveBeenCalledTimes(1);
    });

    it("shows settings windows when ready-to-show event is emitted", () => {
        const imageWindow = windowManager.createImageSettingsWindow() as any;
        const dimensionWindow = windowManager.createDimensionSettingsWindow() as any;

        imageWindow.__emit("ready-to-show");
        dimensionWindow.__emit("ready-to-show");

        expect(imageWindow.show).toHaveBeenCalledTimes(1);
        expect(dimensionWindow.show).toHaveBeenCalledTimes(1);
    });

    it("prevents main close when project is dirty and user cancels discard", () => {
        const mainWindow = windowManager.createMainWindow() as any;
        windowManager.setProjectDirty(true);
        dialogMock.showMessageBoxSync.mockReturnValue(0);
        const event = { preventDefault: vi.fn() };

        mainWindow.__emit("close", event);

        expect(dialogMock.showMessageBoxSync).toHaveBeenCalledTimes(1);
        expect(event.preventDefault).toHaveBeenCalledTimes(1);
        expect(
            mockWindowRepository.saveWindowPositionAndSize
        ).not.toHaveBeenCalled();
    });

    it("allows main close when project is dirty and user confirms discard", () => {
        const mainWindow = windowManager.createMainWindow() as any;
        windowManager.setProjectDirty(true);
        dialogMock.showMessageBoxSync.mockReturnValue(1);
        const event = { preventDefault: vi.fn() };

        mainWindow.__emit("close", event);

        expect(dialogMock.showMessageBoxSync).toHaveBeenCalledTimes(1);
        expect(event.preventDefault).not.toHaveBeenCalled();
        expect(mockWindowRepository.saveWindowPositionAndSize).toHaveBeenCalledWith(
            [100, 200],
            [800, 600],
            false
        );
    });

    it("close listeners tolerate null child-window references", () => {
        windowManager.createMainWindow();
        windowManager.createImageSettingsWindow();
        windowManager.createDimensionSettingsWindow();

        const imageWindow = windowManager.getImageSettingsWindow() as any;
        const dimensionWindow = windowManager.getDimensionSettingsWindow() as any;

        (windowManager as any).imageSettingsWindow = null;
        (windowManager as any).dimensionSettingsWindow = null;

        const imageCloseEvent = { preventDefault: vi.fn() };
        const dimensionCloseEvent = { preventDefault: vi.fn() };
        imageWindow.__emit("close", imageCloseEvent);
        dimensionWindow.__emit("close", dimensionCloseEvent);

        expect(imageCloseEvent.preventDefault).toHaveBeenCalledTimes(1);
        expect(dimensionCloseEvent.preventDefault).toHaveBeenCalledTimes(1);
    });

    it("allows dimension settings close during app quit", () => {
        windowManager.createMainWindow();
        windowManager.createDimensionSettingsWindow();
        windowManager.willQuit();
        const settingsWindow = windowManager.getDimensionSettingsWindow() as any;
        const event = { preventDefault: vi.fn() };

        settingsWindow.__emit("close", event);

        expect(event.preventDefault).not.toHaveBeenCalled();
        expect(settingsWindow.hide).not.toHaveBeenCalled();
    });

    it("closes child windows when main window is closed", () => {
        const mainWindow = windowManager.createMainWindow() as any;
        const imageWindow = windowManager.createImageSettingsWindow() as any;
        const dimensionWindow = windowManager.createDimensionSettingsWindow() as any;

        mainWindow.__emit("closed");

        expect(imageWindow.close).toHaveBeenCalledTimes(1);
        expect(dimensionWindow.close).toHaveBeenCalledTimes(1);
        expect(windowManager.getMainWindow()).toBeNull();
    });

    it("ignores close event when main window reference is already cleared", () => {
        const mainWindow = windowManager.createMainWindow() as any;

        mainWindow.__emit("closed");
        const event = { preventDefault: vi.fn() };
        mainWindow.__emit("close", event);

        expect(mockWindowRepository.saveWindowPositionAndSize).not.toHaveBeenCalled();
        expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it("getAllWindows includes main, image, dimension, and splash windows", async () => {
        const launchPromise = windowManager.launchMainWindow();
        const splashWindow = browserWindowState.windows[0];
        splashWindow.__emit("ready-to-show");
        const mainWindow = await launchPromise;
        const imageWindow = windowManager.createImageSettingsWindow();
        const dimensionWindow = windowManager.createDimensionSettingsWindow();

        const windows = windowManager.getAllWindows();

        expect(windows).toContain(mainWindow);
        expect(windows).toContain(imageWindow);
        expect(windows).toContain(dimensionWindow);
        expect(windows).toContain(splashWindow);
    });

    it("getAllWindows excludes destroyed dimension settings window", () => {
        const mainWindow = windowManager.createMainWindow();
        const imageWindow = windowManager.createImageSettingsWindow();
        const dimensionWindow = windowManager.createDimensionSettingsWindow() as any;

        dimensionWindow.__setDestroyed(true);
        const windows = windowManager.getAllWindows();

        expect(windows).toContain(mainWindow);
        expect(windows).toContain(imageWindow);
        expect(windows).not.toContain(dimensionWindow);
    });
});
