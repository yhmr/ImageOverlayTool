import Store from "electron-store";
import { AppConfig } from "../../shared/types/AppConfig";
import { WindowRepository, IWindowRepository } from "./WindowRepository";

export class WindowRepositoryFactory {
    static create(): IWindowRepository {
        const store = new Store<AppConfig>();
        return new WindowRepository(store);
    }
}
