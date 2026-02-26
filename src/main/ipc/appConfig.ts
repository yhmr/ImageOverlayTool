import { BrowserWindow } from "electron";
import { ISettingsRepository } from "../repositories/SettingsRepository";
import { IWindowRepository } from "../repositories/WindowRepository";
import { settingsEventContracts } from "../../shared/ipc/contracts";
import { registerSettingsHandlers } from "./appConfig/settingsHandlers";
import { registerTransferHandlers } from "./appConfig/transferHandlers";
import { registerWindowHandlers } from "./appConfig/windowHandlers";
import type { AppConfigHandlerContext } from "./appConfig/types";

/**
 * アプリケーション設定(AppConfig)に関するIPCハンドラーを登録します。
 *
 * 設定の読み込み・保存、エクスポート・インポート、ウィンドウカラー関連の
 * 各ハンドラーを初期化し、IPC通信のエンドポイントを構築します。
 *
 * @param settingsRepository 設定データのリポジトリ
 * @param windowRepository ウィンドウ状態のリポジトリ
 */
export const registerAppConfigHandlers = (
    settingsRepository: ISettingsRepository,
    windowRepository: IWindowRepository
) => {
    const broadcastLanguageUpdated = (language: string) => {
        BrowserWindow.getAllWindows().forEach((win) => {
            win.webContents.send(
                settingsEventContracts.languageUpdated.event,
                language
            );
        });
    };

    const context: AppConfigHandlerContext = {
        settingsRepository,
        windowRepository,
        broadcastLanguageUpdated,
    };

    registerSettingsHandlers(context);
    registerWindowHandlers(context);
    registerTransferHandlers(context);
};
