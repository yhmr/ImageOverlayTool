import { WindowRepository, IWindowRepository } from "./WindowRepository";
import { getSharedStore } from "./sharedStore";

export class WindowRepositoryFactory {
    static create(): IWindowRepository {
        return new WindowRepository(getSharedStore());
    }
}
