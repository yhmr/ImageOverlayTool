import { SettingsRepository, ISettingsRepository } from "./SettingsRepository";
import { getSharedStore } from "./sharedStore";

export class SettingsRepositoryFactory {
    static create(): ISettingsRepository {
        return new SettingsRepository(getSharedStore());
    }
}
