import { ipcMain, dialog, BrowserWindow } from "electron";
import { SettingType } from "../../renderer/types/AppConfig";
import { IConfigRepository } from "../repositories/ConfigRepository";

export const registerAppConfigHandlers = (
  mainWindow: BrowserWindow,
  repository: IConfigRepository
) => {
  /**
   * [IPC] 指定ファイルの内容を返却
   */
  ipcMain.handle("dialog:openFile", async () => {
    // ファイルを選択
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      buttonLabel: "Open", // 確認ボタンのラベル
      filters: [{ name: "Text", extensions: ["jpg", "jpeg", "png"] }],
      properties: [
        "openFile", // ファイルの選択を許可
        "createDirectory", // ディレクトリの作成を許可 (macOS)
      ],
    });

    if (canceled) {
      return;
    } else {
      return filePaths[0];
    }
  });

  /**
   * [IPC] 設定の読み込み
   */
  ipcMain.handle("setting:load", async () => {
    return await repository.loadSettings();
  });

  /**
   * [IPC] 設定の保存
   */
  ipcMain.handle("setting:save", async (event, arg: SettingType) => {
    await repository.saveSettings(arg);
  });

  /**
   * [IPC] ウィンドウ色の読み込み
   */
  ipcMain.handle("window_color:load", async () => {
    return await repository.loadWindowColor();
  });

  /**
   * [IPC] ウィンドウ色の保存
   */
  ipcMain.handle("window_color:save", async (event, color: string) => {
    await repository.saveWindowColor(color);
  });
};
