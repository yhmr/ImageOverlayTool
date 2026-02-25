import type { SettingType } from "../../../shared/types/AppConfig";
import { getElectronApi } from "./electronApi";
import type { ISettingsIPCService } from "./types";

export const createSettingsIPCService = (): ISettingsIPCService => ({
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
