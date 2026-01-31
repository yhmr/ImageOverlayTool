import { describe, it, expect, vi, beforeEach } from "vitest";
import { ipcMain } from "electron";
import { registerAppConfigHandlers } from "@/main/ipc/appConfig";
import { MockSettingsRepository } from "../repositories/mocks/MockSettingsRepository";
import { MockWindowRepository } from "../repositories/mocks/MockWindowRepository";
import { SettingType } from "@/shared/types/AppConfig";

// Mock electron
vi.mock("electron", () => ({
    ipcMain: {
        handle: vi.fn(),
    },
    app: {
        isPackaged: false,
    },
}));

// Mock logger
vi.mock("@/main/logger", () => ({
    default: {
        debug: vi.fn(),
        info: vi.fn(),
        error: vi.fn(),
    },
}));

describe("IPC AppConfig Handlers", () => {
    let mockSettingsRepo: MockSettingsRepository;
    let mockWindowRepo: MockWindowRepository;

    beforeEach(() => {
        vi.clearAllMocks();
        mockSettingsRepo = new MockSettingsRepository();
        mockWindowRepo = new MockWindowRepository();

        // Register handlers using mock repositories
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
            const handlers = vi.mocked(ipcMain.handle).mock.calls;
            const saveHandler = handlers.find((call) => call[0] === "setting:save")?.[1];
            const loadHandler = handlers.find((call) => call[0] === "setting:load")?.[1];

            expect(saveHandler).toBeDefined();
            expect(loadHandler).toBeDefined();

            if (saveHandler && loadHandler) {
                // Save new settings
                const newSettings: SettingType = { language: "ja" };
                await saveHandler({} as any, newSettings);

                // Load settings and verify
                const result = await loadHandler({} as any);
                expect(result).toEqual({ language: "ja" });
            }
        });
    });

    describe("window_color:save & window_color:load", () => {
        it("should save and load window color via repository", async () => {
            const handlers = vi.mocked(ipcMain.handle).mock.calls;
            const saveHandler = handlers.find((call) => call[0] === "window_color:save")?.[1];
            const loadHandler = handlers.find((call) => call[0] === "window_color:load")?.[1];

            expect(saveHandler).toBeDefined();
            expect(loadHandler).toBeDefined();

            if (saveHandler && loadHandler) {
                // Save new color
                const newColor = "#12345678";
                await saveHandler({} as any, newColor);

                // Load color and verify
                const result = await loadHandler({} as any);
                expect(result).toBe(newColor);
            }
        });
        describe("Errors handling", () => {
            it("setting:load should throw error on failure", async () => {
                vi.spyOn(mockSettingsRepo, "loadSettings").mockRejectedValue(new Error("Load failed"));
                const handler = vi.mocked(ipcMain.handle).mock.calls.find((call) => call[0] === "setting:load")?.[1];
                if (handler) {
                    await expect(handler({} as any)).rejects.toThrow("Load failed");
                }
            });

            it("setting:save should throw error on failure", async () => {
                vi.spyOn(mockSettingsRepo, "saveSettings").mockRejectedValue(new Error("Save failed"));
                const handler = vi.mocked(ipcMain.handle).mock.calls.find((call) => call[0] === "setting:save")?.[1];
                if (handler) {
                    await expect(handler({} as any, {})).rejects.toThrow("Save failed");
                }
            });

            it("window_color:load should throw error on failure", async () => {
                vi.spyOn(mockWindowRepo, "loadWindowColor").mockRejectedValue(new Error("Window Load failed"));
                const handler = vi.mocked(ipcMain.handle).mock.calls.find((call) => call[0] === "window_color:load")?.[1];
                if (handler) {
                    await expect(handler({} as any)).rejects.toThrow("Window Load failed");
                }
            });

            it("window_color:save should throw error on failure", async () => {
                vi.spyOn(mockWindowRepo, "saveWindowColor").mockRejectedValue(new Error("Window Save failed"));
                const handler = vi.mocked(ipcMain.handle).mock.calls.find((call) => call[0] === "window_color:save")?.[1];
                if (handler) {
                    await expect(handler({} as any, "#fff")).rejects.toThrow("Window Save failed");
                }
            });
        });
    });
});
