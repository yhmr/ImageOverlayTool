import type { SettingType } from "../../types/AppConfig";
import {
    defineEventContract,
    defineInvokeContract,
    type EventContract,
    type InvokeContract,
} from "../contract";
import { IPC_CHANNELS, IPC_EVENTS } from "../channels";

/**
 * アプリケーション設定およびウィンドウ設定のIPC通信におけるRequest/Responseの型定義群
 */
export type SettingsInvokeContracts = {
    load: InvokeContract<[], SettingType>;
    save: InvokeContract<[setting: SettingType], void>;
    export: InvokeContract<[], string | null>;
    import: InvokeContract<[], SettingType | null>;
    windowColorLoad: InvokeContract<[], string>;
    windowColorSave: InvokeContract<[color: string], void>;
    windowColorPresetsLoad: InvokeContract<[], string[]>;
    windowColorPresetsSave: InvokeContract<[presets: string[]], void>;
};

/**
 * アプリケーション設定変更等のPublish/Subscribe型IPC通信の型定義群
 */
export type SettingsEventContracts = {
    languageUpdated: EventContract<[language: string]>;
    clickThroughShortcutTriggered: EventContract<[]>;
    alwaysOnTopShortcutTriggered: EventContract<[]>;
};

/** アプリケーション設定関連(Invoke)IPC通信の契約定義オブジェクト */
export const settingsIpcContracts: SettingsInvokeContracts = {
    load: defineInvokeContract(IPC_CHANNELS.setting.load),
    save: defineInvokeContract(IPC_CHANNELS.setting.save),
    export: defineInvokeContract(IPC_CHANNELS.setting.export),
    import: defineInvokeContract(IPC_CHANNELS.setting.import),
    windowColorLoad: defineInvokeContract(IPC_CHANNELS.setting.windowColorLoad),
    windowColorSave: defineInvokeContract(IPC_CHANNELS.setting.windowColorSave),
    windowColorPresetsLoad: defineInvokeContract(
        IPC_CHANNELS.setting.windowColorPresetsLoad
    ),
    windowColorPresetsSave: defineInvokeContract(
        IPC_CHANNELS.setting.windowColorPresetsSave
    ),
};

/** アプリケーション設定関連(Event)IPC通信の契約定義オブジェクト */
export const settingsEventContracts: SettingsEventContracts = {
    languageUpdated: defineEventContract(IPC_EVENTS.languageUpdated),
    clickThroughShortcutTriggered: defineEventContract(
        IPC_EVENTS.clickThroughShortcutTriggered
    ),
    alwaysOnTopShortcutTriggered: defineEventContract(
        IPC_EVENTS.alwaysOnTopShortcutTriggered
    ),
};
