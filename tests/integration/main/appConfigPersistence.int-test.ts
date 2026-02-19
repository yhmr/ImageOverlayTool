import fs from "fs/promises";
import os from "os";
import path from "path";
import type Store from "electron-store";
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
import {
    invokeIpcHandler,
    resetIpcHandlerRegistry,
} from "../../support/helpers/ipcTestHelper";

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

const asElectronStore = <T extends object>(
    store: InMemoryStore<T>
): Store<T> => store as unknown as Store<T>;

describe("Main integration: appConfig persistence", () => {
    let tempRootDir: string;
    let exportPath: string;
    let importPath: string;
    let languageBroadcastSend: ReturnType<typeof vi.fn>;
    let store: InMemoryStore<AppConfig>;

    beforeEach(async () => {
        vi.clearAllMocks();
        resetIpcHandlerRegistry();

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

        store = new InMemoryStore<AppConfig>({
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
            new SettingsRepository(asElectronStore(store)),
            new WindowRepository(asElectronStore(store))
        );
    });

    afterEach(async () => {
        await fs.rm(tempRootDir, { recursive: true, force: true });
    });

    it("save: setting:save persists setting values", async () => {
        await invokeIpcHandler("setting:save", { sender: {} }, {
            language: "en",
            logLevel: "debug",
        });

        expect(store.get("setting.language")).toBe("en");
        expect(store.get("setting.logLevel")).toBe("debug");
    });

    it("save: window_color:save persists window color", async () => {
        await invokeIpcHandler("window_color:save", { sender: {} }, "#12345678");

        expect(store.get("window.color")).toBe("#12345678");
    });

    it("load: setting:load returns current setting snapshot", async () => {
        store.set("setting", {
            language: "en",
            logLevel: "warn",
        });

        const loadedSettings = await invokeIpcHandler("setting:load", {
            sender: {},
        });

        expect(loadedSettings).toEqual({
            language: "en",
            logLevel: "warn",
        });
    });

    it("load: window_color:load returns current window color", async () => {
        store.set("window.color", "#AABBCCDD");

        const loadedWindowColor = await invokeIpcHandler("window_color:load", {
            sender: {},
        });

        expect(loadedWindowColor).toBe("#AABBCCDD");
    });

    it("export: setting:export writes snapshot file to selected path", async () => {
        store.set("setting", {
            language: "en",
            logLevel: "warn",
        });
        store.set("window.color", "#11223344");

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
    });

    it("import: setting:import persists imported settings and window color", async () => {
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
    });

    it("language broadcast: setting:save emits languageUpdated for all windows", async () => {
        await invokeIpcHandler("setting:save", { sender: {} }, {
            language: "en",
            logLevel: "debug",
        });

        expect(mockSetLogLevel).toHaveBeenCalledWith("debug");
        expect(mockInitializeMainI18n).toHaveBeenCalledWith("en");
        expect(languageBroadcastSend).toHaveBeenCalledWith(
            IPC_EVENTS.languageUpdated,
            "en"
        );
    });

    it("language broadcast: setting:import emits languageUpdated for all windows", async () => {
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

        await invokeIpcHandler("setting:import", {
            sender: {},
        });

        expect(mockSetLogLevel).toHaveBeenCalledWith("error");
        expect(mockInitializeMainI18n).toHaveBeenCalledWith("ja");
        expect(languageBroadcastSend).toHaveBeenCalledWith(
            IPC_EVENTS.languageUpdated,
            "ja"
        );
    });
});
