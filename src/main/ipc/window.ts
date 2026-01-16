import { ipcMain, BrowserWindow, app } from "electron";
import log from "../logger";

export const registerWindowHandlers = (mainWindow: BrowserWindow) => {
    /**
     * [IPC] Windowサイズを切り替え
     */
    ipcMain.handle("window:switchSize", async () => {
        if (!mainWindow.isMaximized()) {
            log.debug("[IPC] window:switchSize -> maximizing");
            mainWindow.maximize();
            return true;
        } else {
            log.debug("[IPC] window:switchSize -> unmaximizing");
            mainWindow.unmaximize();
            return false;
        }
    });

    /**
     * [IPC] Windowを閉じる
     */
    ipcMain.handle("window:close", async () => {
        log.info("[IPC] window:close called, quitting application");
        app.quit();
    });

    /**
     * [IPC] Windowの位置とサイズを設定
     */
    ipcMain.handle(
        "window:setRect",
        async (
            event,
            rect: { x: number; y: number; width: number; height: number }
        ) => {
            log.debug(`[IPC] window:setRect called: ${JSON.stringify(rect)}`);
            mainWindow.setBounds(rect);
        }
    );
};
