import {
    settingsEventContracts,
    settingsIpcContracts,
} from "../../shared/ipc/contracts";
import type { SettingType } from "../../shared/types/AppConfig";
import { invokeIpcContract, onIpcEventContract } from "./client";

export const createSettingsApi = () => ({
    loadSetting: () => invokeIpcContract(settingsIpcContracts.load),
    saveSetting: (setting: SettingType) =>
        invokeIpcContract(settingsIpcContracts.save, setting),
    exportSettings: () => invokeIpcContract(settingsIpcContracts.export),
    importSettings: () => invokeIpcContract(settingsIpcContracts.import),
    onLanguageUpdated: (callback: (language: string) => void) =>
        onIpcEventContract(settingsEventContracts.languageUpdated, callback),
    onClickThroughShortcutTriggered: (callback: () => void) =>
        onIpcEventContract(
            settingsEventContracts.clickThroughShortcutTriggered,
            callback
        ),
    onAlwaysOnTopShortcutTriggered: (callback: () => void) =>
        onIpcEventContract(
            settingsEventContracts.alwaysOnTopShortcutTriggered,
            callback
        ),
    loadWindowColor: () =>
        invokeIpcContract(settingsIpcContracts.windowColorLoad),
    saveWindowColor: (color: string) =>
        invokeIpcContract(settingsIpcContracts.windowColorSave, color),
    loadWindowColorPresets: () =>
        invokeIpcContract(settingsIpcContracts.windowColorPresetsLoad),
    saveWindowColorPresets: (presets: string[]) =>
        invokeIpcContract(settingsIpcContracts.windowColorPresetsSave, presets),
});
