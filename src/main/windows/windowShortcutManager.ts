import { globalShortcut } from "electron";

export interface IWindowShortcutManager {
    registerToggleClickThroughMode(callback: () => void): void;
    unregisterAll(): void;
}

export class ElectronWindowShortcutManager implements IWindowShortcutManager {
    registerToggleClickThroughMode(callback: () => void): void {
        globalShortcut.register("CommandOrControl+Shift+M", callback);
    }

    unregisterAll(): void {
        globalShortcut.unregisterAll();
    }
}
