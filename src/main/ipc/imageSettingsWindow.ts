import { ipcMain, dialog, BrowserWindow } from "electron";
import { WindowManager } from "../windows/windowManager";
import { ImageSet } from "../../shared/types/ImageSet";

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
    ipcMain.handle("imageSets:update", (event, imageSets: ImageSet[]) => {
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

    /**
     * [IPC] 初期状態の要求
     * 設定ウィンドウが開いたときに呼ばれる。メインウィンドウに同期要求を送る。
     */
    ipcMain.handle("state:requestInitial", (event) => {
        const windows = windowManager.getAllWindows();
        windows.forEach((win) => {
            // 要求元以外（つまりメインウィンドウなど）に「今の状態をくれ」と依頼する
            if (win.webContents.id !== event.sender.id) {
                win.webContents.send("state:requestSync");
            }
        });
    });

    /**
     * [IPC] 画像読み込み
     */
    ipcMain.handle("image:load", async (event) => {
        const window = BrowserWindow.fromWebContents(event.sender);
        if (!window) return;

        const { canceled, filePaths } = await dialog.showOpenDialog(window, {
            buttonLabel: "Open",
            filters: [
                {
                    name: "Image",
                    extensions: ["jpg", "jpeg", "png", "webp", "gif", "svg"],
                },
            ],
            properties: ["openFile"],
        });

        if (canceled) {
            return;
        } else {
            return filePaths[0];
        }
    });
};
