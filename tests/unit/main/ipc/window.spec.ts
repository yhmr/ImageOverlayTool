import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserWindow } from "electron";
import { registerWindowHandlers } from "@/main/ipc/window";
import { IPC_CHANNELS } from "@/shared/ipc/channels";
import { invokeIpcHandler } from "../../../support/helpers/ipcTestHelper";

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

type MainWindowMock = Pick<
    BrowserWindow,
    | "isMaximized"
    | "minimize"
    | "maximize"
    | "unmaximize"
    | "close"
    | "setBounds"
    | "setIgnoreMouseEvents"
    | "setAlwaysOnTop"
    | "setResizable"
>;

type SenderWindowMock = Pick<
    BrowserWindow,
    "setBounds" | "setIgnoreMouseEvents" | "setAlwaysOnTop"
>;

const asBrowserWindow = (value: Partial<BrowserWindow>): BrowserWindow =>
    value as unknown as BrowserWindow;

const createMainWindowMock = (): MainWindowMock => ({
    isMaximized: vi.fn(() => false),
    minimize: vi.fn(),
    maximize: vi.fn(),
    unmaximize: vi.fn(),
    close: vi.fn(),
    setBounds: vi.fn(),
    setIgnoreMouseEvents: vi.fn(),
    setAlwaysOnTop: vi.fn(),
    setResizable: vi.fn(),
});

const createSenderWindowMock = (): SenderWindowMock => ({
    setBounds: vi.fn(),
    setIgnoreMouseEvents: vi.fn(),
    setAlwaysOnTop: vi.fn(),
});

describe("window IPC handlers", () => {
    let mainWindowMock: MainWindowMock;

    beforeEach(() => {
        vi.clearAllMocks();
        mainWindowMock = createMainWindowMock();
        registerWindowHandlers(asBrowserWindow(mainWindowMock));
    });

    it("switchSize maximizes when current window is not maximized", async () => {
        vi.mocked(mainWindowMock.isMaximized).mockReturnValue(false);

        const result = await invokeIpcHandler<boolean>(
            IPC_CHANNELS.window.switchSize
        );

        expect(mainWindowMock.maximize).toHaveBeenCalledTimes(1);
        expect(result).toBe(true);
    });

    it("minimize delegates to mainWindow.minimize", async () => {
        await invokeIpcHandler(IPC_CHANNELS.window.minimize);

        expect(mainWindowMock.minimize).toHaveBeenCalledTimes(1);
    });

    it("switchSize unmaximizes and enables resize when current window is maximized", async () => {
        vi.mocked(mainWindowMock.isMaximized).mockReturnValue(true);

        const result = await invokeIpcHandler<boolean>(
            IPC_CHANNELS.window.switchSize
        );

        expect(mainWindowMock.unmaximize).toHaveBeenCalledTimes(1);
        expect(mainWindowMock.setResizable).toHaveBeenCalledWith(true);
        expect(result).toBe(false);
    });

    it("close delegates to mainWindow.close", async () => {
        await invokeIpcHandler(IPC_CHANNELS.window.close);

        expect(mainWindowMock.close).toHaveBeenCalledTimes(1);
    });

    it("setRect applies bounds to sender window when available", async () => {
        const senderWindowMock = createSenderWindowMock();
        vi.mocked(BrowserWindow.fromWebContents).mockReturnValue(
            asBrowserWindow(senderWindowMock)
        );

        const rect = { x: 10, y: 20, width: 100, height: 200 };
        await invokeIpcHandler(
            IPC_CHANNELS.window.setRect,
            { sender: {} },
            rect
        );

        expect(senderWindowMock.setBounds).toHaveBeenCalledWith(rect);
        expect(mainWindowMock.setBounds).not.toHaveBeenCalled();
    });

    it("setRect falls back to main window when sender window is unavailable", async () => {
        vi.mocked(BrowserWindow.fromWebContents).mockReturnValue(null);

        const rect = { x: 10, y: 20, width: 100, height: 200 };
        await invokeIpcHandler(
            IPC_CHANNELS.window.setRect,
            { sender: {} },
            rect
        );

        expect(mainWindowMock.setBounds).toHaveBeenCalledWith(rect);
    });

    it("setAlwaysOnTop uses sender window when available", async () => {
        const senderWindowMock = createSenderWindowMock();
        vi.mocked(BrowserWindow.fromWebContents).mockReturnValue(
            asBrowserWindow(senderWindowMock)
        );

        await invokeIpcHandler(
            IPC_CHANNELS.window.setAlwaysOnTop,
            { sender: {} },
            true
        );

        expect(senderWindowMock.setAlwaysOnTop).toHaveBeenCalledWith(true);
        expect(mainWindowMock.setAlwaysOnTop).not.toHaveBeenCalled();
    });

    it("setAlwaysOnTop falls back to main window when sender window is unavailable", async () => {
        vi.mocked(BrowserWindow.fromWebContents).mockReturnValue(null);

        await invokeIpcHandler(
            IPC_CHANNELS.window.setAlwaysOnTop,
            { sender: {} },
            false
        );

        expect(mainWindowMock.setAlwaysOnTop).toHaveBeenCalledWith(false);
    });

    it("setIgnoreMouseEvents coerces truthy values on sender window", async () => {
        const senderWindowMock = createSenderWindowMock();
        vi.mocked(BrowserWindow.fromWebContents).mockReturnValue(
            asBrowserWindow(senderWindowMock)
        );

        await invokeIpcHandler(
            IPC_CHANNELS.window.setIgnoreMouseEvents,
            { sender: {} },
            1
        );

        expect(senderWindowMock.setIgnoreMouseEvents).toHaveBeenCalledWith(
            true,
            { forward: true }
        );
    });

    it("setIgnoreMouseEvents falls back to main window and coerces falsy values", async () => {
        vi.mocked(BrowserWindow.fromWebContents).mockReturnValue(null);

        await invokeIpcHandler(
            IPC_CHANNELS.window.setIgnoreMouseEvents,
            { sender: {} },
            0
        );

        expect(mainWindowMock.setIgnoreMouseEvents).toHaveBeenCalledWith(
            false,
            { forward: true }
        );
    });
});


