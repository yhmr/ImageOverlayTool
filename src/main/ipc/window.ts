import { ipcMain, BrowserWindow, app } from "electron";

export const registerWindowHandlers = (mainWindow: BrowserWindow) => {
  /**
   * [IPC] Windowサイズを切り替え
   */
  ipcMain.handle("window:switchSize", async () => {
    if (!mainWindow.isMaximized()) {
      mainWindow.maximize();
      return true;
    } else {
      mainWindow.unmaximize();
      return false;
    }
  });

  /**
   * [IPC] Windowを閉じる
   */
  ipcMain.handle("window:close", async () => {
    app.quit();
  });
};
