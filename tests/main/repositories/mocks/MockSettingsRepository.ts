import { SettingType } from "@/shared/types/AppConfig";
import { ISettingsRepository } from "@/main/repositories/SettingsRepository";

export class MockSettingsRepository implements ISettingsRepository {
    private settings = {
        language: "en",
    };

    async loadSettings(): Promise<{ language: string }> {
        return { ...this.settings };
    }

    async saveSettings(settings: SettingType): Promise<void> {
        if (settings.language !== undefined) {
            this.settings.language = settings.language;
        }
    }
}
