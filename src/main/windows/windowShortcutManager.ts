import { globalShortcut } from "electron";

export interface IWindowShortcutManager {
    registerToggleAlwaysOnTopMode(callback: () => void): void;
    registerToggleClickThroughMode(callback: () => void): void;
    unregisterAll(): void;
}

export class ElectronWindowShortcutManager implements IWindowShortcutManager {
    registerToggleAlwaysOnTopMode(callback: () => void): void {
        globalShortcut.register("CommandOrControl+Shift+T", callback);
    }

    registerToggleClickThroughMode(callback: () => void): void {
        globalShortcut.register("CommandOrControl+Shift+M", callback);
    }

    unregisterAll(): void {
        globalShortcut.unregisterAll();
    }
}
