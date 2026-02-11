import { ipcMain } from "electron";
import { SettingType } from "../../shared/types/AppConfig";
import { ISettingsRepository } from "../repositories/SettingsRepository";
import { IWindowRepository } from "../repositories/WindowRepository";
import log from "../logger";
import { IPC_CHANNELS } from "../../shared/ipc/channels";

export const registerAppConfigHandlers = (
    settingsRepository: ISettingsRepository,
    windowRepository: IWindowRepository
) => {
    ipcMain.handle(IPC_CHANNELS.setting.load, async () => {
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

    ipcMain.handle(
        IPC_CHANNELS.setting.save,
        async (event, arg: SettingType) => {
            log.debug("[IPC] setting:save called");
            try {
                await settingsRepository.saveSettings(arg);
                log.info("[IPC] setting:save completed");
            } catch (error) {
                log.error("[IPC] setting:save failed:", error);
                throw error;
            }
        }
    );

    ipcMain.handle(IPC_CHANNELS.setting.windowColorLoad, async () => {
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

    ipcMain.handle(
        IPC_CHANNELS.setting.windowColorSave,
        async (event, color: string) => {
            log.debug(`[IPC] window_color:save called with: ${color}`);
            try {
                await windowRepository.saveWindowColor(color);
                log.info(`[IPC] window_color:save completed: ${color}`);
            } catch (error) {
                log.error("[IPC] window_color:save failed:", error);
                throw error;
            }
        }
    );
};
