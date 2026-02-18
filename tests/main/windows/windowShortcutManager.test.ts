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

    it("registers Ctrl/Cmd+Shift+M shortcut", () => {
        const manager = new ElectronWindowShortcutManager();
        const callback = vi.fn();

        manager.registerToggleClickThroughMode(callback);

        expect(register).toHaveBeenCalledWith(
            "CommandOrControl+Shift+M",
            callback
        );
    });

    it("unregisters all shortcuts", () => {
        const manager = new ElectronWindowShortcutManager();

        manager.unregisterAll();

        expect(unregisterAll).toHaveBeenCalledTimes(1);
    });
});
