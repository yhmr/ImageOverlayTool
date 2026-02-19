import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "fs/promises";
import { registerAppConfigHandlers } from "@/main/ipc/appConfig";
import { MockSettingsRepository } from "../repositories/mocks/MockSettingsRepository";
import { MockWindowRepository } from "../repositories/mocks/MockWindowRepository";
import { SettingType } from "@/shared/types/AppConfig";
import { invokeIpcHandler } from "../utils/ipcTestHelper";
import { setLogLevel } from "@/main/logger";
import { initializeMainI18n } from "@/i18n/mainI18n";
import { IPC_EVENTS } from "@/shared/ipc/channels";

const {
    showSaveDialog,
    showOpenDialog,
    writeFile,
    readFile,
    getAllWindows,
    webContentsSend,
} = vi.hoisted(
    () => ({
        showSaveDialog: vi.fn(),
        showOpenDialog: vi.fn(),
        writeFile: vi.fn(),
        readFile: vi.fn(),
        getAllWindows: vi.fn(),
        webContentsSend: vi.fn(),
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
    BrowserWindow: {
        getAllWindows,
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

// Mock logger
vi.mock("@/main/logger", () => ({
    default: {
        info: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
    },
    setLogLevel: vi.fn(),
}));

vi.mock("@/i18n/mainI18n", () => ({
    initializeMainI18n: vi.fn(),
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
                setting: { language: "en", logLevel: "info" },
                window: { color: "#ffffff" },
            })
        );
        getAllWindows.mockReturnValue([
            {
                webContents: {
                    send: webContentsSend,
                },
            },
        ]);
        mockSettingsRepo = new MockSettingsRepository();
        mockWindowRepo = new MockWindowRepository();
        // Register handlers
        registerAppConfigHandlers(mockSettingsRepo, mockWindowRepo);
    });

    describe("setting:save & setting:load", () => {
        it("should save and load settings via repository", async () => {
            const newSettings: SettingType = { language: "ja", logLevel: "debug" };

            // mocking event object
            const event = { sender: {} };

            // Test setting:save
            await invokeIpcHandler("setting:save", event, newSettings);

            // Verify save (MockSettingsRepository updates internal state)
            const saved = await mockSettingsRepo.loadSettings();
            expect(saved).toEqual({ ...newSettings });

            // Verify setLogLevel called
            expect(setLogLevel).toHaveBeenCalledWith("debug");
            expect(initializeMainI18n).toHaveBeenCalledWith("ja");
            expect(webContentsSend).toHaveBeenCalledWith(
                IPC_EVENTS.languageUpdated,
                "ja"
            );

            // Test setting:load
            const loaded = await invokeIpcHandler("setting:load", event);
            expect(loaded).toEqual(newSettings);
        });

        it("should broadcast language updates to all windows on save", async () => {
            const sendA = vi.fn();
            const sendB = vi.fn();
            getAllWindows.mockReturnValue([
                { webContents: { send: sendA } },
                { webContents: { send: sendB } },
            ]);

            await invokeIpcHandler("setting:save", { sender: {} }, {
                language: "ja",
                logLevel: "info",
            });

            expect(sendA).toHaveBeenCalledWith(IPC_EVENTS.languageUpdated, "ja");
            expect(sendB).toHaveBeenCalledWith(IPC_EVENTS.languageUpdated, "ja");
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

                await expect(invokeIpcHandler("setting:save", { sender: {} }, { language: "en", logLevel: "info" }))
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
            const writeCall = vi.mocked(fs.writeFile).mock.lastCall;
            if (!writeCall) {
                throw new Error("fs.writeFile should be called");
            }
            const payload = JSON.parse(String(writeCall[1]));
            expect(payload.setting.language).toBe("en");
            expect(payload.setting.logLevel).toBe("info");
        });

        it("should return null when export dialog is canceled", async () => {
            showSaveDialog.mockResolvedValueOnce({
                canceled: true,
                filePath: "",
            });

            const result = await invokeIpcHandler("setting:export", {
                sender: {},
            });

            expect(result).toBeNull();
            expect(fs.writeFile).not.toHaveBeenCalled();
        });

        it("should import settings snapshot from selected file", async () => {
            const loaded = await invokeIpcHandler("setting:import", {
                sender: {},
            });
            expect(showOpenDialog).toHaveBeenCalledTimes(1);
            expect(fs.readFile).toHaveBeenCalledWith("settings.json", "utf8");
            expect(loaded).toEqual({ language: "en", logLevel: "info" });
            expect(setLogLevel).toHaveBeenCalledWith("info");
            expect(initializeMainI18n).toHaveBeenCalledWith("en");
            expect(webContentsSend).toHaveBeenCalledWith(
                IPC_EVENTS.languageUpdated,
                "en"
            );
        });

        it("should return null when import dialog is canceled", async () => {
            showOpenDialog.mockResolvedValueOnce({
                canceled: true,
                filePaths: [],
            });

            const result = await invokeIpcHandler("setting:import", {
                sender: {},
            });

            expect(result).toBeNull();
            expect(fs.readFile).not.toHaveBeenCalled();
        });

        it("should throw when imported settings format is invalid", async () => {
            readFile.mockResolvedValueOnce("1");

            await expect(
                invokeIpcHandler("setting:import", { sender: {} })
            ).rejects.toThrow("Invalid settings file format.");
        });

        it("should import settings without changing log level when missing", async () => {
            readFile.mockResolvedValueOnce(
                JSON.stringify({
                    version: 1,
                    exportedAt: "2026-02-12T00:00:00.000Z",
                    setting: { language: "ja" },
                    window: { color: "#000000" },
                })
            );
            vi.spyOn(mockSettingsRepo, "loadSettings").mockResolvedValueOnce({
                language: "ja",
                logLevel: "",
            });

            const loaded = await invokeIpcHandler("setting:import", {
                sender: {},
            });

            expect(loaded).toEqual({ language: "ja", logLevel: "" });
            expect(setLogLevel).not.toHaveBeenCalled();
            expect(initializeMainI18n).toHaveBeenCalledWith("ja");
        });
    });
});
