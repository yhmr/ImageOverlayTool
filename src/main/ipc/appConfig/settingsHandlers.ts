import { ipcMain } from "electron";
import { SettingType } from "../../../shared/types/AppConfig";
import { settingsIpcContracts } from "../../../shared/ipc/contracts";
import log, { setLogLevel, LevelOption } from "../../logger";
import { initializeMainI18n } from "../../../i18n/mainI18n";
import type { AppConfigHandlerContext } from "./types";

/**
 * アプリケーション設定の読み込みと保存を担うIPCハンドラーを登録します。
 *
 * 保存時にはログレベルの更新や、i18nの再初期化・言語変更のブロードキャストも行います。
 *
 * @param context ハンドラー間で共有するコンテキスト(リポジトリとブロードキャスト関数)
 */
export const registerSettingsHandlers = (
    context: AppConfigHandlerContext
): void => {
    ipcMain.handle(settingsIpcContracts.load.channel, async () => {
        log.debug("[IPC] setting:load called");
        try {
            const settings = await context.settingsRepository.loadSettings();
            log.debug("[IPC] setting:load completed");
            return settings;
        } catch (error) {
            log.error("[IPC] setting:load failed:", error);
            throw error;
        }
    });

    ipcMain.handle(
        settingsIpcContracts.save.channel,
        async (_event, arg: SettingType) => {
            log.debug("[IPC] setting:save called");
            try {
                await context.settingsRepository.saveSettings(arg);
                if (arg.logLevel) {
                    setLogLevel(arg.logLevel as LevelOption);
                }
                const loaded = await context.settingsRepository.loadSettings();
                await initializeMainI18n(loaded.language);
                context.broadcastLanguageUpdated(loaded.language);
                log.info("[IPC] setting:save completed");
            } catch (error) {
                log.error("[IPC] setting:save failed:", error);
                throw error;
            }
        }
    );
};
