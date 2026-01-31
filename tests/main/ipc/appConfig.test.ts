import { describe, it, expect, vi, beforeEach } from "vitest";
import { ipcMain } from "electron";
import { registerAppConfigHandlers } from "@/main/ipc/appConfig";
import { MockSettingsRepository } from "../repositories/mocks/MockSettingsRepository";
import { MockWindowRepository } from "../repositories/mocks/MockWindowRepository";
import { SettingType } from "@/shared/types/AppConfig";
import { invokeIpcHandler } from "../utils/ipcTestHelper";

// Mock electron
vi.mock("electron", () => ({
    ipcMain: {
        handle: vi.fn(),
    },
    app: {
        isPackaged: false,
    },
}));

describe("IPC AppConfig Handlers", () => {
    let mockSettingsRepo: MockSettingsRepository;
    let mockWindowRepo: MockWindowRepository;

    beforeEach(() => {
        vi.clearAllMocks();
        mockSettingsRepo = new MockSettingsRepository();
        mockWindowRepo = new MockWindowRepository();
        // Register handlers
        registerAppConfigHandlers(mockSettingsRepo, mockWindowRepo);
    });

    it("should register handlers for app config events", () => {
        expect(ipcMain.handle).toHaveBeenCalledWith("setting:load", expect.any(Function));
        expect(ipcMain.handle).toHaveBeenCalledWith("setting:save", expect.any(Function));
        expect(ipcMain.handle).toHaveBeenCalledWith("window_color:load", expect.any(Function));
        expect(ipcMain.handle).toHaveBeenCalledWith("window_color:save", expect.any(Function));
    });

    describe("setting:save & setting:load", () => {
        it("should save and load settings via repository", async () => {
            const newSettings: SettingType = { language: "ja" };

            // mocking event object
            const event = { sender: {} };

            // Test setting:save
            await invokeIpcHandler("setting:save", event, newSettings);

            // Verify save (MockSettingsRepository updates internal state)
            const saved = await mockSettingsRepo.loadSettings();
            expect(saved).toEqual(newSettings);

            // Test setting:load
            const loaded = await invokeIpcHandler("setting:load", event);
            expect(loaded).toEqual(newSettings);
        });
    });

    describe("window_color:save & window_color:load", () => {
        it("should save and load window color via repository", async () => {
            const newColor = "#ff0000";

            // mocking event object
            const event = { sender: {} };

            // Test window_color:save
            await invokeIpcHandler("window_color:save", event, newColor);

            // Verify save
            const saved = await mockWindowRepo.loadWindowColor();
            expect(saved).toBe(newColor);

            // Test window_color:load
            const loaded = await invokeIpcHandler("window_color:load", event);
            expect(loaded).toBe(newColor);
        });

        describe("Errors handling", () => {
            it("setting:load should throw error on failure", async () => {
                const error = new Error("Load settings failed");
                vi.spyOn(mockSettingsRepo, "loadSettings").mockRejectedValue(error);

                await expect(invokeIpcHandler("setting:load", { sender: {} }))
                    .rejects.toThrow("Load settings failed");
            });

            it("setting:save should throw error on failure", async () => {
                const error = new Error("Save settings failed");
                vi.spyOn(mockSettingsRepo, "saveSettings").mockRejectedValue(error);

                await expect(invokeIpcHandler("setting:save", { sender: {} }, { language: "en" }))
                    .rejects.toThrow("Save settings failed");
            });

            it("window_color:load should throw error on failure", async () => {
                const error = new Error("Load color failed");
                vi.spyOn(mockWindowRepo, "loadWindowColor").mockRejectedValue(error);

                await expect(invokeIpcHandler("window_color:load", { sender: {} }))
                    .rejects.toThrow("Load color failed");
            });

            it("window_color:save should throw error on failure", async () => {
                const error = new Error("Save color failed");
                vi.spyOn(mockWindowRepo, "saveWindowColor").mockRejectedValue(error);

                await expect(invokeIpcHandler("window_color:save", { sender: {} }, "#000"))
                    .rejects.toThrow("Save color failed");
            });
        });
    });
});
