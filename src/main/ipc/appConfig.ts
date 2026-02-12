import fs from "fs/promises";
import { dialog, ipcMain } from "electron";
import {
    SettingType,
    SettingsSnapshot,
} from "../../shared/types/AppConfig";
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

    ipcMain.handle(IPC_CHANNELS.setting.export, async () => {
        log.debug("[IPC] setting:export called");
        try {
            const snapshot = await settingsRepository.exportSettingsSnapshot();
            const result = await dialog.showSaveDialog({
                title: "Export Settings",
                defaultPath: "imageoverlaytool-settings.json",
                filters: [{ name: "JSON", extensions: ["json"] }],
            });

            if (result.canceled || !result.filePath) {
                return null;
            }

            await fs.writeFile(
                result.filePath,
                JSON.stringify(snapshot, null, 2),
                "utf8"
            );
            log.info(`[IPC] setting:export completed: ${result.filePath}`);
            return result.filePath;
        } catch (error) {
            log.error("[IPC] setting:export failed:", error);
            throw error;
        }
    });

    ipcMain.handle(IPC_CHANNELS.setting.import, async () => {
        log.debug("[IPC] setting:import called");
        try {
            const result = await dialog.showOpenDialog({
                title: "Import Settings",
                properties: ["openFile"],
                filters: [{ name: "JSON", extensions: ["json"] }],
            });

            if (result.canceled || result.filePaths.length === 0) {
                return null;
            }

            const filePath = result.filePaths[0];
            const raw = await fs.readFile(filePath, "utf8");
            const parsed: unknown = JSON.parse(raw);

            if (!isSettingsSnapshot(parsed)) {
                throw new Error("Invalid settings file format.");
            }

            await settingsRepository.importSettingsSnapshot(parsed);
            const loaded = await settingsRepository.loadSettings();
            log.info(`[IPC] setting:import completed: ${filePath}`);
            return loaded;
        } catch (error) {
            log.error("[IPC] setting:import failed:", error);
            throw error;
        }
    });
};

const isSettingsSnapshot = (value: unknown): value is SettingsSnapshot => {
    if (!value || typeof value !== "object") {
        return false;
    }

    const snapshot = value as Partial<SettingsSnapshot>;
    return (
        snapshot.version === 1 &&
        typeof snapshot.exportedAt === "string" &&
        typeof snapshot.setting?.language === "string" &&
        typeof snapshot.window?.color === "string"
    );
};
