import { SettingType, SettingsSnapshot } from "@/shared/types/AppConfig";
import { ISettingsRepository } from "@/main/repositories/SettingsRepository";

export class MockSettingsRepository implements ISettingsRepository {
    private settings = {
        language: "en",
    };
    private windowColor = "#FFFFFF55";

    async loadSettings(): Promise<{ language: string }> {
        return { ...this.settings };
    }

    async saveSettings(settings: SettingType): Promise<void> {
        if (settings.language !== undefined) {
            this.settings.language = settings.language;
        }
    }

    async exportSettingsSnapshot(): Promise<SettingsSnapshot> {
        return {
            version: 1,
            exportedAt: new Date().toISOString(),
            setting: { ...this.settings },
            window: {
                color: this.windowColor,
            },
        };
    }

    async importSettingsSnapshot(snapshot: SettingsSnapshot): Promise<void> {
        this.settings = { ...snapshot.setting };
        this.windowColor = snapshot.window.color;
    }
}
