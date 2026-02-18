import { beforeEach, describe, expect, it, vi } from "vitest";

const { register, unregisterAll } = vi.hoisted(() => ({
    register: vi.fn(),
    unregisterAll: vi.fn(),
}));

vi.mock("electron", () => ({
    globalShortcut: {
        register,
        unregisterAll,
    },
}));

import { ElectronWindowShortcutManager } from "@/main/windows/windowShortcutManager";

describe("ElectronWindowShortcutManager", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("registers Ctrl/Cmd+I shortcut", () => {
        const manager = new ElectronWindowShortcutManager();
        const callback = vi.fn();

        manager.registerToggleImageSettings(callback);

        expect(register).toHaveBeenCalledWith("CommandOrControl+I", callback);
    });

    it("registers Ctrl/Cmd+D shortcut", () => {
        const manager = new ElectronWindowShortcutManager();
        const callback = vi.fn();

        manager.registerToggleDimensionSettings(callback);

        expect(register).toHaveBeenCalledWith("CommandOrControl+D", callback);
    });

    it("unregisters all shortcuts", () => {
        const manager = new ElectronWindowShortcutManager();

        manager.unregisterAll();

        expect(unregisterAll).toHaveBeenCalledTimes(1);
    });
});
