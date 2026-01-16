import { ipcMain } from "electron";
import { SettingType } from "../../shared/types/AppConfig";
import { ISettingsRepository } from "../repositories/SettingsRepository";
import { IWindowRepository } from "../repositories/WindowRepository";
import log from "../logger";

export const registerAppConfigHandlers = (
    settingsRepository: ISettingsRepository,
    windowRepository: IWindowRepository
) => {
    /**
     * [IPC] 設定の読み込み
     */
    ipcMain.handle("setting:load", async () => {
        log.debug("[IPC] setting:load called");
        try {
            const settings = await settingsRepository.loadSettings();
            log.debug("[IPC] setting:load completed");
            return settings;
        } catch (error) {
            log.error("[IPC] setting:load failed:", error);
            throw error;
        }
    });

    /**
     * [IPC] 設定の保存
     */
    ipcMain.handle("setting:save", async (event, arg: SettingType) => {
        log.debug("[IPC] setting:save called");
        try {
            await settingsRepository.saveSettings(arg);
            log.info("[IPC] setting:save completed");
        } catch (error) {
            log.error("[IPC] setting:save failed:", error);
            throw error;
        }
    });

    /**
     * [IPC] ウィンドウ色の読み込み
     */
    ipcMain.handle("window_color:load", async () => {
        log.debug("[IPC] window_color:load called");
        try {
            const color = await windowRepository.loadWindowColor();
            log.debug(`[IPC] window_color:load completed: ${color}`);
            return color;
        } catch (error) {
            log.error("[IPC] window_color:load failed:", error);
            throw error;
        }
    });

    /**
     * [IPC] ウィンドウ色の保存
     */
    ipcMain.handle("window_color:save", async (event, color: string) => {
        log.debug(`[IPC] window_color:save called with: ${color}`);
        try {
            await windowRepository.saveWindowColor(color);
            log.info(`[IPC] window_color:save completed: ${color}`);
        } catch (error) {
            log.error("[IPC] window_color:save failed:", error);
            throw error;
        }
    });
};
