import { globalShortcut } from "electron";

export interface IWindowShortcutManager {
    registerToggleImageSettings(callback: () => void): void;
    registerToggleDimensionSettings(callback: () => void): void;
    unregisterAll(): void;
}

export class ElectronWindowShortcutManager implements IWindowShortcutManager {
    registerToggleImageSettings(callback: () => void): void {
        globalShortcut.register("CommandOrControl+I", callback);
    }

    registerToggleDimensionSettings(callback: () => void): void {
        globalShortcut.register("CommandOrControl+D", callback);
    }

    unregisterAll(): void {
        globalShortcut.unregisterAll();
    }
}
