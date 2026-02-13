import { ipcMain, BrowserWindow, app } from "electron";
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
        log.info("[IPC] window:close called, quitting application");
        app.quit();
    });

    ipcMain.handle(
        IPC_CHANNELS.window.setRect,
        async (
            event,
            rect: { x: number; y: number; width: number; height: number }
        ) => {
            log.debug(`[IPC] window:setRect called: ${JSON.stringify(rect)}`);
            mainWindow.setBounds(rect);
        }
    );
};
