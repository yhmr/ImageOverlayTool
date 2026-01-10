import { ipcMain } from "electron";
import { WindowManager } from "../windows/windowManager";

/**
 * 画像設定ウィンドウ用のIPCハンドラを登録
 */
export const registerImageSettingsWindowHandlers = (
    windowManager: WindowManager
) => {
    /**
     * [IPC] 画像設定ウィンドウの表示/非表示をトグル
     */
    ipcMain.handle("imageSettingsWindow:toggle", async () => {
        return windowManager.toggleImageSettingsWindow();
    });

    /**
     * [IPC] imageSetsの更新を他のウィンドウに通知
     */
    ipcMain.handle("imageSets:update", async (_event, imageSets) => {
        const mainWindow = windowManager.getMainWindow();
        const imageSettingsWindow = windowManager.getImageSettingsWindow();

        // 送信元以外のウィンドウに通知
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send("imageSets:updated", imageSets);
        }
        if (imageSettingsWindow && !imageSettingsWindow.isDestroyed()) {
            imageSettingsWindow.webContents.send("imageSets:updated", imageSets);
        }
    });
};
