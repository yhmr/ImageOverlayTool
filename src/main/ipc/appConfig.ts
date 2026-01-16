import { ipcMain } from "electron";
import { SettingType } from "../../shared/types/AppConfig";
import { ISettingsRepository } from "../repositories/SettingsRepository";
import { IWindowRepository } from "../repositories/WindowRepository";

export const registerAppConfigHandlers = (
    settingsRepository: ISettingsRepository,
    windowRepository: IWindowRepository
) => {
    /**
     * [IPC] 設定の読み込み
     */
    ipcMain.handle("setting:load", async () => {
        return await settingsRepository.loadSettings();
    });

    /**
     * [IPC] 設定の保存
     */
    ipcMain.handle("setting:save", async (event, arg: SettingType) => {
        await settingsRepository.saveSettings(arg);
    });

    /**
     * [IPC] ウィンドウ色の読み込み
     */
    ipcMain.handle("window_color:load", async () => {
        return await windowRepository.loadWindowColor();
    });

    /**
     * [IPC] ウィンドウ色の保存
     */
    ipcMain.handle("window_color:save", async (event, color: string) => {
        await windowRepository.saveWindowColor(color);
    });
};
