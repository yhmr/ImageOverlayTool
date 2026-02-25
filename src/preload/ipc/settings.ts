import { IPC_CHANNELS, IPC_EVENTS } from "../../shared/ipc/channels";
import type { SettingType } from "../../shared/types/AppConfig";
import { invokeIpc, onIpcEvent } from "./client";

export const createSettingsApi = () => ({
    loadSetting: () => invokeIpc<SettingType>(IPC_CHANNELS.setting.load),
    saveSetting: (setting: SettingType) =>
        invokeIpc(IPC_CHANNELS.setting.save, setting),
    exportSettings: () => invokeIpc<string | null>(IPC_CHANNELS.setting.export),
    importSettings: () =>
        invokeIpc<SettingType | null>(IPC_CHANNELS.setting.import),
    onLanguageUpdated: (callback: (language: string) => void) =>
        onIpcEvent(IPC_EVENTS.languageUpdated, callback),
    onClickThroughShortcutTriggered: (callback: () => void) =>
        onIpcEvent(IPC_EVENTS.clickThroughShortcutTriggered, callback),
    onAlwaysOnTopShortcutTriggered: (callback: () => void) =>
        onIpcEvent(IPC_EVENTS.alwaysOnTopShortcutTriggered, callback),
    loadWindowColor: () =>
        invokeIpc<string>(IPC_CHANNELS.setting.windowColorLoad),
    saveWindowColor: (color: string) =>
        invokeIpc(IPC_CHANNELS.setting.windowColorSave, color),
    loadWindowColorPresets: () =>
        invokeIpc<string[]>(IPC_CHANNELS.setting.windowColorPresetsLoad),
    saveWindowColorPresets: (presets: string[]) =>
        invokeIpc(IPC_CHANNELS.setting.windowColorPresetsSave, presets),
});
