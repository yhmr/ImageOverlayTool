import Store from "electron-store";
import { AppConfig, SettingType } from "../../shared/types/AppConfig";

export interface ISettingsRepository {
    loadSettings(): Promise<{ language: string }>;
    saveSettings(settings: SettingType): Promise<void>;
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
}
