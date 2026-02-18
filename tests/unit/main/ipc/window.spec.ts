import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserWindow, ipcMain } from "electron";
import { registerWindowHandlers } from "@/main/ipc/window";
import { IPC_CHANNELS } from "@/shared/ipc/channels";

vi.mock("electron", () => ({
    ipcMain: {
        handle: vi.fn(),
    },
    BrowserWindow: {
        fromWebContents: vi.fn(),
    },
    app: {
        quit: vi.fn(),
    },
}));

vi.mock("@/main/logger", () => ({
    default: {
        debug: vi.fn(),
        info: vi.fn(),
    },
}));

describe("window IPC handlers", () => {
    let mainWindowMock: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mainWindowMock = {
            isMaximized: vi.fn(),
            maximize: vi.fn(),
            unmaximize: vi.fn(),
            close: vi.fn(),
            setBounds: vi.fn(),
            setIgnoreMouseEvents: vi.fn(),
            setAlwaysOnTop: vi.fn(),
            setResizable: vi.fn(),
        };
    });

    it("registers all window handlers", () => {
        registerWindowHandlers(mainWindowMock);
        expect(ipcMain.handle).toHaveBeenCalledWith(
            IPC_CHANNELS.window.switchSize,
            expect.any(Function)
        );
        expect(ipcMain.handle).toHaveBeenCalledWith(
            IPC_CHANNELS.window.close,
            expect.any(Function)
        );
        expect(ipcMain.handle).toHaveBeenCalledWith(
            IPC_CHANNELS.window.setRect,
            expect.any(Function)
        );
        expect(ipcMain.handle).toHaveBeenCalledWith(
            IPC_CHANNELS.window.setIgnoreMouseEvents,
            expect.any(Function)
        );
        expect(ipcMain.handle).toHaveBeenCalledWith(
            IPC_CHANNELS.window.setAlwaysOnTop,
            expect.any(Function)
        );
    });

    it("switchSize handler maximizes if not maximized", async () => {
        registerWindowHandlers(mainWindowMock);
        const switchSizeHandler = vi.mocked(ipcMain.handle).mock.calls.find(
            (call) => call[0] === IPC_CHANNELS.window.switchSize
        )?.[1] as any;

        mainWindowMock.isMaximized.mockReturnValue(false);

        const result = await switchSizeHandler();

        expect(mainWindowMock.maximize).toHaveBeenCalled();
        expect(result).toBe(true);
    });

    it("switchSize handler unmaximizes and enables resizing if maximized", async () => {
        registerWindowHandlers(mainWindowMock);
        const switchSizeHandler = vi.mocked(ipcMain.handle).mock.calls.find(
            (call) => call[0] === IPC_CHANNELS.window.switchSize
        )?.[1] as any;

        mainWindowMock.isMaximized.mockReturnValue(true);

        const result = await switchSizeHandler();

        expect(mainWindowMock.unmaximize).toHaveBeenCalled();
        expect(mainWindowMock.setResizable).toHaveBeenCalledWith(true);
        expect(result).toBe(false);
    });

    it("close handler closes main window", async () => {
        registerWindowHandlers(mainWindowMock);
        const closeHandler = vi.mocked(ipcMain.handle).mock.calls.find(
            (call) => call[0] === IPC_CHANNELS.window.close
        )?.[1] as any;

        await closeHandler();

        expect(mainWindowMock.close).toHaveBeenCalledTimes(1);
    });

    it("setRect handler calls setBounds on sender window when available", async () => {
        registerWindowHandlers(mainWindowMock);
        const setRectHandler = vi.mocked(ipcMain.handle).mock.calls.find(
            (call) => call[0] === IPC_CHANNELS.window.setRect
        )?.[1] as any;

        const senderWindowMock = {
            setBounds: vi.fn(),
        };
        vi.mocked(BrowserWindow.fromWebContents).mockReturnValue(
            senderWindowMock as any
        );

        const rect = { x: 10, y: 20, width: 100, height: 200 };
        await setRectHandler({ sender: {} }, rect);

        expect(senderWindowMock.setBounds).toHaveBeenCalledWith(rect);
    });

    it("setRect handler falls back to mainWindow when sender window is unavailable", async () => {
        registerWindowHandlers(mainWindowMock);
        const setRectHandler = vi.mocked(ipcMain.handle).mock.calls.find(
            (call) => call[0] === IPC_CHANNELS.window.setRect
        )?.[1] as any;
        vi.mocked(BrowserWindow.fromWebContents).mockReturnValue(null);

        const rect = { x: 10, y: 20, width: 100, height: 200 };
        await setRectHandler({ sender: {} }, rect);

        expect(mainWindowMock.setBounds).toHaveBeenCalledWith(rect);
    });

    it("setAlwaysOnTop handler calls sender window when available", async () => {
        registerWindowHandlers(mainWindowMock);
        const setAlwaysOnTopHandler = vi.mocked(ipcMain.handle).mock.calls.find(
            (call) => call[0] === IPC_CHANNELS.window.setAlwaysOnTop
        )?.[1] as any;

        const senderWindowMock = {
            setAlwaysOnTop: vi.fn(),
        };
        vi.mocked(BrowserWindow.fromWebContents).mockReturnValue(
            senderWindowMock as any
        );

        await setAlwaysOnTopHandler({ sender: {} }, true);

        expect(senderWindowMock.setAlwaysOnTop).toHaveBeenCalledWith(true);
    });

    it("setAlwaysOnTop handler falls back to mainWindow when sender window is unavailable", async () => {
        registerWindowHandlers(mainWindowMock);
        const setAlwaysOnTopHandler = vi.mocked(ipcMain.handle).mock.calls.find(
            (call) => call[0] === IPC_CHANNELS.window.setAlwaysOnTop
        )?.[1] as any;
        vi.mocked(BrowserWindow.fromWebContents).mockReturnValue(null);

        await setAlwaysOnTopHandler({ sender: {} }, false);

        expect(mainWindowMock.setAlwaysOnTop).toHaveBeenCalledWith(false);
    });

    it("setIgnoreMouseEvents handler uses sender window when available", async () => {
        registerWindowHandlers(mainWindowMock);
        const setIgnoreMouseEventsHandler = vi
            .mocked(ipcMain.handle)
            .mock.calls.find(
                (call) => call[0] === IPC_CHANNELS.window.setIgnoreMouseEvents
            )?.[1] as any;
        const senderWindowMock = {
            setIgnoreMouseEvents: vi.fn(),
        };
        vi.mocked(BrowserWindow.fromWebContents).mockReturnValue(
            senderWindowMock as any
        );

        await setIgnoreMouseEventsHandler({ sender: {} }, 1 as any);

        expect(senderWindowMock.setIgnoreMouseEvents).toHaveBeenCalledWith(
            true,
            {
                forward: true,
            }
        );
    });

    it("setIgnoreMouseEvents handler falls back to mainWindow when sender window is unavailable", async () => {
        registerWindowHandlers(mainWindowMock);
        const setIgnoreMouseEventsHandler = vi
            .mocked(ipcMain.handle)
            .mock.calls.find(
                (call) => call[0] === IPC_CHANNELS.window.setIgnoreMouseEvents
            )?.[1] as any;
        vi.mocked(BrowserWindow.fromWebContents).mockReturnValue(null);

        await setIgnoreMouseEventsHandler({ sender: {} }, 0 as any);

        expect(mainWindowMock.setIgnoreMouseEvents).toHaveBeenCalledWith(false, {
            forward: true,
        });
    });
});
