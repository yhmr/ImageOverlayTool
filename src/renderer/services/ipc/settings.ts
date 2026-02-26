import type { SettingType } from "../../../shared/types/AppConfig";
import { getElectronApi } from "./electronApi";
import type { IElectronAPI } from "../../../shared/ipc/electronApi";

/**
 * レンダラープロセス内で設定およびウィンドウ設定通信を担うサービスのインターフェース
 */
type SettingsIPCService = Pick<
    IElectronAPI,
    | "loadSetting"
    | "saveSetting"
    | "exportSettings"
    | "importSettings"
    | "onLanguageUpdated"
    | "loadWindowColor"
    | "saveWindowColor"
    | "loadWindowColorPresets"
    | "saveWindowColorPresets"
>;

/**
 * アプリケーション設定管理IPC通信サービスを生成して返します。
 */
export const createSettingsIPCService = (): SettingsIPCService => ({
    loadSetting: () => getElectronApi().loadSetting(),
    saveSetting: (setting: SettingType) =>
        getElectronApi().saveSetting(setting),
    exportSettings: () => getElectronApi().exportSettings(),
    importSettings: () => getElectronApi().importSettings(),
    onLanguageUpdated: (callback: (language: string) => void) =>
        getElectronApi().onLanguageUpdated(callback),
    loadWindowColor: () => getElectronApi().loadWindowColor(),
    saveWindowColor: (color: string) => getElectronApi().saveWindowColor(color),
    loadWindowColorPresets: () => getElectronApi().loadWindowColorPresets(),
    saveWindowColorPresets: (presets: string[]) =>
        getElectronApi().saveWindowColorPresets(presets),
});
