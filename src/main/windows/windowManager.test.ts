import { describe, it, expect, vi, beforeEach } from 'vitest';

// Define mocks using hoisted to ensure they are available in vi.mock factory
const { mockWindow, mockWebContents } = vi.hoisted(() => {
    const webContents = { send: vi.fn(), id: 1 };
    const win = {
        isDestroyed: vi.fn().mockReturnValue(false),
        isVisible: vi.fn().mockReturnValue(true),
        webContents: webContents,
        on: vi.fn(),
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
vi.mock('electron', () => {
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
            appendSwitch: vi.fn()
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
            handle: vi.fn()
        },
        Menu: {
            setApplicationMenu: vi.fn()
        },
        dialog: {
            showOpenDialog: vi.fn()
        }
    };
});

vi.mock('@electron-toolkit/utils', () => ({
    is: {
        dev: false,
        mac: false,
        windows: true,
        linux: false,
    }
}));

import { WindowManager } from './windowManager';

describe('WindowManager', () => {
    let windowManager: WindowManager;
    let mockConfigRepository: any;

    beforeEach(() => {
        vi.clearAllMocks();

        mockConfigRepository = {
            loadSettings: vi.fn(),
            saveSettings: vi.fn(),
            loadWindowColor: vi.fn(),
            saveWindowColor: vi.fn(),
            getWindowPositionAndSize: vi.fn().mockReturnValue({ pos: { x: 0, y: 0 }, size: { width: 800, height: 600 } }),
            saveWindowPositionAndSize: vi.fn(),
            getImageSettingsWindowPositionAndSize: vi.fn().mockReturnValue({ pos: { x: 0, y: 0 }, size: { width: 300, height: 400 } }),
            saveImageSettingsWindowPositionAndSize: vi.fn(),
            loadProject: vi.fn(),
        } as any;
        windowManager = new WindowManager(mockConfigRepository);
    });

    it('openFile sends IPC message if window exists and visible', () => {
        windowManager.createMainWindow();

        windowManager.openFile('test.png');

        expect(mockWebContents.send).toHaveBeenCalledWith('file:open', { filePath: 'test.png', ext: '.png' });
    });

    it('openFile pends file if window not ready, and sends it when ready', () => {
        // 1. Request openFile before window creation
        windowManager.openFile('test.png');

        // 2. Capture ready handler
        let readyHandler: Function | undefined;
        mockWindow.on.mockImplementation((event: string, handler: Function) => {
            if (event === 'ready-to-show') readyHandler = handler;
        });

        // 3. Create window
        windowManager.createMainWindow();

        // 4. Trigger ready-to-show
        if (readyHandler) readyHandler();

        expect(mockWebContents.send).toHaveBeenCalledWith('file:open', { filePath: 'test.png', ext: '.png' });
    });
});
