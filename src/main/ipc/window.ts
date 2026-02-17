import { ipcMain, BrowserWindow } from "electron";
import log from "../logger";
import { IPC_CHANNELS } from "../../shared/ipc/channels";

export const registerWindowHandlers = (mainWindow: BrowserWindow) => {
    ipcMain.handle(IPC_CHANNELS.window.switchSize, async () => {
        if (!mainWindow.isMaximized()) {
            log.debug("[IPC] window:switchSize -> maximizing");
            mainWindow.maximize();
            return true;
        } else {
            log.debug("[IPC] window:switchSize -> unmaximizing");
            mainWindow.unmaximize();
            mainWindow.setResizable(true);
            return false;
        }
    });

    ipcMain.handle(IPC_CHANNELS.window.close, async () => {
        log.info("[IPC] window:close called");
        mainWindow.close();
    });

    ipcMain.handle(
        IPC_CHANNELS.window.setRect,
        async (
            event,
            rect: { x: number; y: number; width: number; height: number }
        ) => {
            log.debug(`[IPC] window:setRect called: ${JSON.stringify(rect)}`);
            const targetWindow =
                BrowserWindow.fromWebContents(event.sender) ?? mainWindow;
            targetWindow.setBounds(rect);
        }
    );

    ipcMain.handle(
        IPC_CHANNELS.window.setIgnoreMouseEvents,
        async (event, ignore: boolean) => {
            const targetWindow =
                BrowserWindow.fromWebContents(event.sender) ?? mainWindow;
            targetWindow.setIgnoreMouseEvents(Boolean(ignore), {
                forward: true,
            });
        }
    );

    ipcMain.handle(
        IPC_CHANNELS.window.setAlwaysOnTop,
        async (event, enabled: boolean) => {
            const targetWindow =
                BrowserWindow.fromWebContents(event.sender) ?? mainWindow;
            targetWindow.setAlwaysOnTop(Boolean(enabled));
        }
    );
};
