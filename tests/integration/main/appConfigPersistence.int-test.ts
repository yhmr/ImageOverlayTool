import fs from "fs/promises";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
    mockShowSaveDialog,
    mockShowOpenDialog,
    mockGetAllWindows,
    mockSetLogLevel,
    mockInitializeMainI18n,
} = vi.hoisted(() => ({
    mockShowSaveDialog: vi.fn(),
    mockShowOpenDialog: vi.fn(),
    mockGetAllWindows: vi.fn(),
    mockSetLogLevel: vi.fn(),
    mockInitializeMainI18n: vi.fn(),
}));

vi.mock("electron", () => ({
    ipcMain: {
        handle: vi.fn(),
    },
    dialog: {
        showSaveDialog: mockShowSaveDialog,
        showOpenDialog: mockShowOpenDialog,
    },
    BrowserWindow: {
        getAllWindows: mockGetAllWindows,
    },
    screen: {
        getPrimaryDisplay: () => ({
            workAreaSize: {
                width: 1920,
                height: 1080,
            },
        }),
    },
    app: {
        isPackaged: true,
    },
}));

vi.mock("@/main/logger", () => ({
    default: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
    setLogLevel: mockSetLogLevel,
}));

vi.mock("@/i18n/mainI18n", () => ({
    initializeMainI18n: mockInitializeMainI18n,
}));

import { registerAppConfigHandlers } from "@/main/ipc/appConfig";
import { SettingsRepository } from "@/main/repositories/SettingsRepository";
import { WindowRepository } from "@/main/repositories/WindowRepository";
import { IPC_EVENTS } from "@/shared/ipc/channels";
import type { AppConfig, SettingsSnapshot } from "@/shared/types/AppConfig";
import { invokeIpcHandler } from "../../unit/main/utils/ipcTestHelper";

class InMemoryStore<T extends object> {
    private data: Record<string, unknown>;

    constructor(initialData: T) {
        this.data = initialData as unknown as Record<string, unknown>;
    }

    public get<R>(key: string, fallback?: R): R {
        const value = key
            .split(".")
            .reduce<unknown>((current, segment) => {
                if (
                    current &&
                    typeof current === "object" &&
                    segment in (current as Record<string, unknown>)
                ) {
                    return (current as Record<string, unknown>)[segment];
                }
                return undefined;
            }, this.data);

        return (value === undefined ? fallback : value) as R;
    }

    public set(key: string, value: unknown): void {
        const segments = key.split(".");
        let cursor: Record<string, unknown> = this.data;

        for (const segment of segments.slice(0, -1)) {
            const next = cursor[segment];
            if (!next || typeof next !== "object") {
                cursor[segment] = {};
            }
            cursor = cursor[segment] as Record<string, unknown>;
        }

        cursor[segments[segments.length - 1]] = value;
    }
}

describe("Main integration: appConfig persistence", () => {
    let tempRootDir: string;
    let exportPath: string;
    let importPath: string;
    let languageBroadcastSend: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
        vi.clearAllMocks();

        tempRootDir = await fs.mkdtemp(path.join(os.tmpdir(), "iot-int-"));
        exportPath = path.join(tempRootDir, "settings-export.json");
        importPath = path.join(tempRootDir, "settings-import.json");

        mockShowSaveDialog.mockResolvedValue({
            canceled: false,
            filePath: exportPath,
        });
        mockShowOpenDialog.mockResolvedValue({
            canceled: false,
            filePaths: [importPath],
        });

        languageBroadcastSend = vi.fn();
        mockGetAllWindows.mockReturnValue([
            {
                webContents: {
                    send: languageBroadcastSend,
                },
            },
        ]);

        const store = new InMemoryStore<AppConfig>({
            setting: {
                language: "ja",
                logLevel: "info",
            },
            window: {
                pos: { x: 0, y: 0 },
                size: { width: 800, height: 600 },
                color: "#FFFFFF55",
            },
            imageSettingsWindow: {
                pos: { x: 0, y: 0 },
                size: { width: 400, height: 500 },
            },
            dimensionSettingsWindow: {
                pos: { x: 40, y: 40 },
                size: { width: 460, height: 560 },
            },
        });

        registerAppConfigHandlers(
            new SettingsRepository(store as any),
            new WindowRepository(store as any)
        );
    });

    afterEach(async () => {
        await fs.rm(tempRootDir, { recursive: true, force: true });
    });

    it("saves/loads settings and window color through IPC with repository persistence", async () => {
        await invokeIpcHandler("setting:save", { sender: {} }, {
            language: "en",
            logLevel: "debug",
        });
        await invokeIpcHandler("window_color:save", { sender: {} }, "#12345678");

        const loadedSettings = await invokeIpcHandler("setting:load", {
            sender: {},
        });
        const loadedWindowColor = await invokeIpcHandler("window_color:load", {
            sender: {},
        });

        expect(loadedSettings).toEqual({
            language: "en",
            logLevel: "debug",
        });
        expect(loadedWindowColor).toBe("#12345678");
        expect(mockSetLogLevel).toHaveBeenCalledWith("debug");
        expect(mockInitializeMainI18n).toHaveBeenCalledWith("en");
        expect(languageBroadcastSend).toHaveBeenCalledWith(
            IPC_EVENTS.languageUpdated,
            "en"
        );
    });

    it("exports then imports settings snapshot through real files", async () => {
        await invokeIpcHandler("setting:save", { sender: {} }, {
            language: "en",
            logLevel: "warn",
        });
        await invokeIpcHandler("window_color:save", { sender: {} }, "#11223344");

        const exportedFilePath = await invokeIpcHandler("setting:export", {
            sender: {},
        });
        expect(exportedFilePath).toBe(exportPath);
        const exported = JSON.parse(
            await fs.readFile(exportPath, "utf8")
        ) as SettingsSnapshot;
        expect(exported.setting).toEqual({
            language: "en",
            logLevel: "warn",
        });
        expect(exported.window).toEqual({
            color: "#11223344",
        });

        const importSnapshot: SettingsSnapshot = {
            version: 1,
            exportedAt: new Date().toISOString(),
            setting: {
                language: "ja",
                logLevel: "error",
            },
            window: {
                color: "#55667788",
            },
        };
        await fs.writeFile(importPath, JSON.stringify(importSnapshot), "utf8");

        const importedSettings = await invokeIpcHandler("setting:import", {
            sender: {},
        });
        const loadedSettings = await invokeIpcHandler("setting:load", {
            sender: {},
        });
        const loadedWindowColor = await invokeIpcHandler("window_color:load", {
            sender: {},
        });

        expect(importedSettings).toEqual({
            language: "ja",
            logLevel: "error",
        });
        expect(loadedSettings).toEqual({
            language: "ja",
            logLevel: "error",
        });
        expect(loadedWindowColor).toBe("#55667788");
        expect(mockSetLogLevel).toHaveBeenCalledWith("error");
        expect(mockInitializeMainI18n).toHaveBeenCalledWith("ja");
        expect(languageBroadcastSend).toHaveBeenCalledWith(
            IPC_EVENTS.languageUpdated,
            "ja"
        );
    });
});
