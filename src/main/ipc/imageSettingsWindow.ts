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
    ipcMain.handle("imageSets:update", (event, imageSets: any[]) => {
        // 全ウィンドウに通知
        const windows = windowManager.getAllWindows();
        windows.forEach((win) => {
            // 送信元ウィンドウ以外にも送るべきか？ -> Redux syncMiddlewareで除外するので全部に送ってもいいが、
            // 無限ループ防止のため送信元以外に送るのが一般的。
            // しかし、送信元でdispatch済みアクションを再度受け取るとループする。
            // 送信元にも送って、Middlewareで無視させる手もあるが、ここでは送信元以外に送るのが安全。
            if (win.webContents.id !== event.sender.id) {
                win.webContents.send("imageSets:updated", imageSets);
            }
        });
    });

    ipcMain.handle("unitFactor:update", (event, unitFactor: number) => {
        const windows = windowManager.getAllWindows();
        windows.forEach((win) => {
            if (win.webContents.id !== event.sender.id) {
                win.webContents.send("unitFactor:updated", unitFactor);
            }
        });
    });
};
