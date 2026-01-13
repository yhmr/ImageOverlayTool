import { ipcMain } from "electron";
import { SettingType } from "../../shared/types/AppConfig";
import { IConfigRepository } from "../repositories/ConfigRepository";

export const registerAppConfigHandlers = (
  repository: IConfigRepository
) => {


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
