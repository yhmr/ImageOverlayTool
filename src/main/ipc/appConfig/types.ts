import type { ISettingsRepository } from "../../repositories/SettingsRepository";
import type { IWindowRepository } from "../../repositories/WindowRepository";

/**
 * アプリケーション設定のIPCハンドラー群で共有される依存関係や関数のコンテキスト
 */
export interface AppConfigHandlerContext {
    /** アプリの設定情報を読み書きするためのリポジトリ */
    settingsRepository: ISettingsRepository;
    /** ウィンドウの背景色などの状態を読み書きするためのリポジトリ */
    windowRepository: IWindowRepository;
    /** 言語の変更をすべてのBrowserWindowに通知するための関数 */
    broadcastLanguageUpdated: (language: string) => void;
}
