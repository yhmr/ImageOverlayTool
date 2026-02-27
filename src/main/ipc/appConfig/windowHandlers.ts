import { ipcMain } from "electron";
import { settingsIpcContracts } from "../../../shared/ipc/contracts";
import log from "../../logger";
import type { AppConfigHandlerContext } from "./types";

/**
 * ウィンドウの背景色やそのプリセットの読み書きを担うIPCハンドラーを登録します。
 *
 * @param context ハンドラー間で共有するコンテキスト(ウィンドウリポジトリ)
 */
export const registerWindowHandlers = (
    context: AppConfigHandlerContext
): void => {
    ipcMain.handle(settingsIpcContracts.windowColorLoad.channel, async () => {
        log.debug("[IPC] window_color:load called");
        try {
            const color = await context.windowRepository.loadWindowColor();
            log.debug(`[IPC] window_color:load completed: ${color}`);
            return color;
        } catch (error) {
            log.error("[IPC] window_color:load failed:", error);
            throw error;
        }
    });

    ipcMain.handle(
        settingsIpcContracts.windowColorSave.channel,
        async (_event, color: string) => {
            log.debug(`[IPC] window_color:save called with: ${color}`);
            try {
                await context.windowRepository.saveWindowColor(color);
                log.info(`[IPC] window_color:save completed: ${color}`);
            } catch (error) {
                log.error("[IPC] window_color:save failed:", error);
                throw error;
            }
        }
    );

    ipcMain.handle(
        settingsIpcContracts.windowColorPresetsLoad.channel,
        async () => {
            log.debug("[IPC] window_color_presets:load called");
            try {
                const presets =
                    await context.windowRepository.loadWindowColorPresets();
                log.debug("[IPC] window_color_presets:load completed");
                return presets;
            } catch (error) {
                log.error("[IPC] window_color_presets:load failed:", error);
                throw error;
            }
        }
    );

    ipcMain.handle(
        settingsIpcContracts.windowColorPresetsSave.channel,
        async (_event, presets: string[]) => {
            log.debug("[IPC] window_color_presets:save called");
            try {
                await context.windowRepository.saveWindowColorPresets(presets);
                log.info("[IPC] window_color_presets:save completed");
            } catch (error) {
                log.error("[IPC] window_color_presets:save failed:", error);
                throw error;
            }
        }
    );
};
