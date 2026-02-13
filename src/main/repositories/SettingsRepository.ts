import Store from "electron-store";
import {
    AppConfig,
    SettingType,
    SettingsSnapshot,
} from "../../shared/types/AppConfig";
import { DEFAULT_LANGUAGE, normalizeLanguage } from "../../i18n/languages";

export interface ISettingsRepository {
    loadSettings(): Promise<SettingType>;
    saveSettings(settings: SettingType): Promise<void>;
    exportSettingsSnapshot(): Promise<SettingsSnapshot>;
    importSettingsSnapshot(snapshot: SettingsSnapshot): Promise<void>;
}

export class SettingsRepository implements ISettingsRepository {
    private store: Store<AppConfig>;

    constructor(store: Store<AppConfig>) {
        this.store = store;
    }

    async loadSettings(): Promise<SettingType> {
        return {
            language: normalizeLanguage(
                this.store.get("setting.language", DEFAULT_LANGUAGE)
            ),
            logLevel: this.store.get("setting.logLevel", "info"),
        };
    }

    async saveSettings(settings: SettingType): Promise<void> {
        if (settings.language !== undefined) {
            this.store.set(
                "setting.language",
                normalizeLanguage(settings.language)
            );
        }
        if (settings.logLevel !== undefined) {
            this.store.set("setting.logLevel", settings.logLevel);
        }
    }

    async exportSettingsSnapshot(): Promise<SettingsSnapshot> {
        return {
            version: 1,
            exportedAt: new Date().toISOString(),
            setting: {
                language: normalizeLanguage(
                    this.store.get("setting.language", DEFAULT_LANGUAGE)
                ),
                logLevel: this.store.get("setting.logLevel", "info"),
            },
            window: {
                color: this.store.get("window.color", "#FFFFFF55"),
            },
        };
    }

    async importSettingsSnapshot(snapshot: SettingsSnapshot): Promise<void> {
        if (snapshot.setting) {
            if (typeof snapshot.setting.language === "string") {
                this.store.set(
                    "setting.language",
                    normalizeLanguage(snapshot.setting.language)
                );
            }
            if (typeof snapshot.setting.logLevel === "string") {
                this.store.set("setting.logLevel", snapshot.setting.logLevel);
            }
        }
        if (typeof snapshot.window?.color === "string") {
            this.store.set("window.color", snapshot.window.color);
        }
    }
}
