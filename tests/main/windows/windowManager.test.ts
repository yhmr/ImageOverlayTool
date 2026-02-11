import { describe, it, expect, vi, beforeEach } from "vitest";

// Define mocks using hoisted to ensure they are available in vi.mock factory
const { mockWindow, mockWebContents } = vi.hoisted(() => {
    const webContents = { send: vi.fn(), id: 1, setWindowOpenHandler: vi.fn() };
    // Create an event emitter like mock
    const listeners: Record<string, ((...args: any[]) => void)[]> = {};

    const win = {
        isDestroyed: vi.fn().mockReturnValue(false),
        isVisible: vi.fn().mockReturnValue(true),
        webContents: webContents,
        on: vi.fn((event: string, handler: (...args: any[]) => void) => {
            if (!listeners[event]) listeners[event] = [];
            listeners[event].push(handler);
        }),
        emit: (event: string) => {
            if (listeners[event]) listeners[event].forEach((h) => h());
        },
        loadURL: vi.fn(),
        loadFile: vi.fn(),
        getPosition: vi.fn(),
        getSize: vi.fn(),
        show: vi.fn(),
        focus: vi.fn(),
        close: vi.fn(),
    };
    return { mockWindow: win, mockWebContents: webContents };
});

// Mock Electron using a class for BrowserWindow
vi.mock("electron", () => {
    class MockBrowserWindow {
        constructor() {
            return mockWindow;
        }
        static fromWebContents() {
            return mockWindow;
        }
    }

    // Mock app properties
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

    return {
        BrowserWindow: MockBrowserWindow,
        app: appMock,
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
    is: {
        dev: false,
        mac: false,
        windows: true,
        linux: false,
    },
}));

import { WindowManager } from "@/main/windows/windowManager";
import { IWindowRepository } from "@/main/repositories/WindowRepository";
import type { IWindowShortcutManager } from "@/main/windows/windowShortcutManager";

describe("WindowManager", () => {
    let windowManager: WindowManager;
    let mockWindowRepository: IWindowRepository;

    beforeEach(() => {
        vi.clearAllMocks();
        // Reset listeners in mock (manual reset needed since hoisted object persists)
        // For simplicity, we just rely on clearAllMocks for spies.

        // Reset isVisible to true by default
        mockWindow.isVisible.mockReturnValue(true);

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
        windowManager.createMainWindow();
        windowManager.openFile("test.png");
        expect(mockWebContents.send).toHaveBeenCalledWith("file:open", {
            filePath: "test.png",
            ext: ".png",
        });
    });

    it("openFile pends file if window not ready, and sends it when ready", () => {
        // 1. Request openFile before window creation
        windowManager.openFile("test.png");

        // 2. Create window
        windowManager.createMainWindow();

        // 3. Trigger ready-to-show
        mockWindow.emit("ready-to-show");

        // 4. Ideally ready-to-show calls show(), which triggers 'show'.
        // verify show() was called
        expect(mockWindow.show).toHaveBeenCalled();

        // Trigger show
        mockWindow.emit("show");

        expect(mockWebContents.send).toHaveBeenCalledWith("file:open", {
            filePath: "test.png",
            ext: ".png",
        });
    });

    it("openFile pends file if window exists but hidden, and sends it when shown", () => {
        windowManager.createMainWindow();

        // Hide window
        mockWindow.isVisible.mockReturnValue(false);

        // Request openFile
        windowManager.openFile("hidden.png");

        // Should NOT have sent yet
        expect(mockWebContents.send).not.toHaveBeenCalledWith("file:open", {
            filePath: "hidden.png",
            ext: ".png",
        });

        // Show window
        mockWindow.isVisible.mockReturnValue(true);
        mockWindow.emit("show");

        // Should send now
        expect(mockWebContents.send).toHaveBeenCalledWith("file:open", {
            filePath: "hidden.png",
            ext: ".png",
        });
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
});
