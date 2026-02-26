import fs from "fs/promises";
import { dialog, ipcMain } from "electron";
import { SettingType, SettingsSnapshot } from "../../../shared/types/AppConfig";
import { settingsIpcContracts } from "../../../shared/ipc/contracts";
import log, { setLogLevel, LevelOption } from "../../logger";
import { initializeMainI18n } from "../../../i18n/mainI18n";
import type { AppConfigHandlerContext } from "./types";

const isSettingsSnapshot = (value: unknown): value is SettingsSnapshot => {
    if (!value || typeof value !== "object") {
        return false;
    }

    const snapshot = value as Partial<SettingsSnapshot>;
    return (
        snapshot.version === 1 &&
        typeof snapshot.exportedAt === "string" &&
        typeof snapshot.setting?.language === "string" &&
        (snapshot.setting?.showWindowFrame === undefined ||
            typeof snapshot.setting.showWindowFrame === "boolean") &&
        typeof snapshot.window?.color === "string" &&
        (snapshot.window?.colorPresets === undefined ||
            (Array.isArray(snapshot.window?.colorPresets) &&
                snapshot.window.colorPresets.every(
                    (preset) => typeof preset === "string"
                )))
    );
};

const applyLoadedSettings = async (
    loaded: SettingType,
    broadcastLanguageUpdated: (language: string) => void
): Promise<void> => {
    if (loaded.logLevel) {
        setLogLevel(loaded.logLevel as LevelOption);
    }
    await initializeMainI18n(loaded.language);
    broadcastLanguageUpdated(loaded.language);
};

export const registerTransferHandlers = (
    context: AppConfigHandlerContext
): void => {
    ipcMain.handle(settingsIpcContracts.export.channel, async () => {
        log.debug("[IPC] setting:export called");
        try {
            const snapshot =
                await context.settingsRepository.exportSettingsSnapshot();
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

    ipcMain.handle(settingsIpcContracts.import.channel, async () => {
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

            await context.settingsRepository.importSettingsSnapshot(parsed);
            const loaded = await context.settingsRepository.loadSettings();
            await applyLoadedSettings(loaded, context.broadcastLanguageUpdated);
            log.info(`[IPC] setting:import completed: ${filePath}`);
            return loaded;
        } catch (error) {
            log.error("[IPC] setting:import failed:", error);
            throw error;
        }
    });
};
