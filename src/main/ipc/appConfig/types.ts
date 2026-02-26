import type { ISettingsRepository } from "../../repositories/SettingsRepository";
import type { IWindowRepository } from "../../repositories/WindowRepository";

export interface AppConfigHandlerContext {
    settingsRepository: ISettingsRepository;
    windowRepository: IWindowRepository;
    broadcastLanguageUpdated: (language: string) => void;
}
