import Store from "electron-store";
import { AppConfig } from "../../shared/types/AppConfig";
import { SettingsRepository, ISettingsRepository } from "./SettingsRepository";

export class SettingsRepositoryFactory {
    static create(): ISettingsRepository {
        const store = new Store<AppConfig>();
        return new SettingsRepository(store);
    }
}
