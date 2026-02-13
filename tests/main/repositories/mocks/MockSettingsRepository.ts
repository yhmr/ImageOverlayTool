import { SettingType, SettingsSnapshot } from "@/shared/types/AppConfig";
import { ISettingsRepository } from "@/main/repositories/SettingsRepository";

export class MockSettingsRepository implements ISettingsRepository {
    private settings: SettingType = {
        language: "en",
        logLevel: "info",
    };
    private windowColor = "#FFFFFF55";

    async loadSettings(): Promise<SettingType> {
        return { ...this.settings };
    }

    async saveSettings(settings: SettingType): Promise<void> {
        this.settings = { ...this.settings, ...settings };
    }

    async exportSettingsSnapshot(): Promise<SettingsSnapshot> {
        return {
            version: 1,
            exportedAt: new Date().toISOString(),
            setting: this.settings as SettingType,
            window: { color: "#ffffff" },
        };
    }

    async importSettingsSnapshot(snapshot: SettingsSnapshot): Promise<void> {
        if (snapshot.setting) {
            this.settings = { ...this.settings, ...snapshot.setting };
        }
        this.windowColor = snapshot.window.color;
    }
}
