import Store from "electron-store";
import {
    AppConfig,
    SettingType,
    SettingsSnapshot,
} from "../../shared/types/AppConfig";

export interface ISettingsRepository {
    loadSettings(): Promise<{ language: string }>;
    saveSettings(settings: SettingType): Promise<void>;
    exportSettingsSnapshot(): Promise<SettingsSnapshot>;
    importSettingsSnapshot(snapshot: SettingsSnapshot): Promise<void>;
}

export class SettingsRepository implements ISettingsRepository {
    private store: Store<AppConfig>;

    constructor(store: Store<AppConfig>) {
        this.store = store;
    }

    async loadSettings(): Promise<{ language: string }> {
        return {
            language: this.store.get("setting.language", "en"),
        };
    }

    async saveSettings(settings: SettingType): Promise<void> {
        if (settings.language !== undefined) {
            this.store.set("setting.language", settings.language);
        }
    }

    async exportSettingsSnapshot(): Promise<SettingsSnapshot> {
        return {
            version: 1,
            exportedAt: new Date().toISOString(),
            setting: {
                language: this.store.get("setting.language", "en"),
            },
            window: {
                color: this.store.get("window.color", "#FFFFFF55"),
            },
        };
    }

    async importSettingsSnapshot(snapshot: SettingsSnapshot): Promise<void> {
        if (typeof snapshot.setting?.language === "string") {
            this.store.set("setting.language", snapshot.setting.language);
        }
        if (typeof snapshot.window?.color === "string") {
            this.store.set("window.color", snapshot.window.color);
        }
    }
}
