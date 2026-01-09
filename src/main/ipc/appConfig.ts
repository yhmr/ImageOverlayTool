import { ipcMain, dialog, BrowserWindow } from "electron";
import Store from "electron-store";
import type { AppConfig, SettingType } from "../../renderer/types/AppConfig";

export const registerAppConfigHandlers = (
  mainWindow: BrowserWindow,
  store: Store<AppConfig>
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
    return {
      language: store.get("setting.language", "en"),
      unit_factor: store.get("setting.unit_factor", 1),
    };
  });

  /**
   * [IPC] 設定の保存
   */
  ipcMain.handle("setting:save", async (event, arg: SettingType) => {
    if (arg.language !== undefined) {
      store.set("setting.language", arg.language);
    }
    if (typeof arg.unit_factor === "number") {
      store.set("setting.unit_factor", arg.unit_factor);
    }
  });

  /**
   * [IPC] ウィンドウ色の読み込み
   */
  ipcMain.handle("window_color:load", async () => {
    return store.get("window.color", "#FFFFFF55");
  });

  /**
   * [IPC] ウィンドウ色の保存
   */
  ipcMain.handle("window_color:save", async (event, color: string) => {
    store.set("window.color", color);
  });
};
