import { describe, it, expect, vi, beforeEach } from "vitest";
import { ipcMain } from "electron";
import fs from "fs/promises";
import { registerAppConfigHandlers } from "@/main/ipc/appConfig";
import { MockSettingsRepository } from "../repositories/mocks/MockSettingsRepository";
import { MockWindowRepository } from "../repositories/mocks/MockWindowRepository";
import { SettingType } from "@/shared/types/AppConfig";
import { invokeIpcHandler } from "../utils/ipcTestHelper";

const { showSaveDialog, showOpenDialog, writeFile, readFile } = vi.hoisted(
    () => ({
        showSaveDialog: vi.fn(),
        showOpenDialog: vi.fn(),
        writeFile: vi.fn(),
        readFile: vi.fn(),
    })
);

// Mock electron
vi.mock("electron", () => ({
    ipcMain: {
        handle: vi.fn(),
    },
    dialog: {
        showSaveDialog,
        showOpenDialog,
    },
    app: {
        isPackaged: false,
    },
}));

vi.mock("fs/promises", () => ({
    default: {
        writeFile,
        readFile,
    },
    writeFile,
    readFile,
}));

describe("IPC AppConfig Handlers", () => {
    let mockSettingsRepo: MockSettingsRepository;
    let mockWindowRepo: MockWindowRepository;

    beforeEach(() => {
        vi.clearAllMocks();
        showSaveDialog.mockResolvedValue({
            canceled: false,
            filePath: "settings.json",
        });
        showOpenDialog.mockResolvedValue({
            canceled: false,
            filePaths: ["settings.json"],
        });
        readFile.mockResolvedValue(
            JSON.stringify({
                version: 1,
                exportedAt: "2026-02-12T00:00:00.000Z",
                setting: { language: "en" },
                window: { color: "#ffffff" },
            })
        );
        mockSettingsRepo = new MockSettingsRepository();
        mockWindowRepo = new MockWindowRepository();
        // Register handlers
        registerAppConfigHandlers(mockSettingsRepo, mockWindowRepo);
    });

    it("should register handlers for app config events", () => {
        expect(ipcMain.handle).toHaveBeenCalledWith("setting:load", expect.any(Function));
        expect(ipcMain.handle).toHaveBeenCalledWith("setting:save", expect.any(Function));
        expect(ipcMain.handle).toHaveBeenCalledWith("setting:export", expect.any(Function));
        expect(ipcMain.handle).toHaveBeenCalledWith("setting:import", expect.any(Function));
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

    describe("setting:export & setting:import", () => {
        it("should export settings snapshot to selected file", async () => {
            await invokeIpcHandler("setting:export", { sender: {} });

            expect(showSaveDialog).toHaveBeenCalledTimes(1);
            expect(fs.writeFile).toHaveBeenCalledTimes(1);
            const payload = JSON.parse(
                vi.mocked(fs.writeFile).mock.calls[0][1] as string
            );
            expect(payload.setting.language).toBe("en");
        });

        it("should import settings snapshot from selected file", async () => {
            const loaded = await invokeIpcHandler("setting:import", {
                sender: {},
            });
            expect(showOpenDialog).toHaveBeenCalledTimes(1);
            expect(fs.readFile).toHaveBeenCalledWith("settings.json", "utf8");
            expect(loaded).toEqual({ language: "en" });
        });
    });
});
