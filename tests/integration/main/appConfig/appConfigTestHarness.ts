import fs from "fs/promises";
import os from "os";
import path from "path";
import type Store from "electron-store";
import { vi } from "vitest";
import type { AppConfig } from "@/shared/types/AppConfig";
import { resetIpcHandlerRegistry } from "../../../support/helpers/ipcTestHelper";
import {
    mockGetAllWindows,
    mockShowOpenDialog,
    mockShowSaveDialog,
} from "./appConfigTestDoubles";

export class InMemoryStore<T extends object> {
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

const createDefaultAppConfig = (): AppConfig => ({
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

export interface AppConfigIntegrationContext {
    tempRootDir: string;
    exportPath: string;
    importPath: string;
    store: InMemoryStore<AppConfig>;
    languageBroadcastSends: Array<ReturnType<typeof vi.fn>>;
    cleanup: () => Promise<void>;
}

export const setupAppConfigIntegration =
    async (): Promise<AppConfigIntegrationContext> => {
        vi.clearAllMocks();
        resetIpcHandlerRegistry();

        const tempRootDir = await fs.mkdtemp(path.join(os.tmpdir(), "iot-int-"));
        const exportPath = path.join(tempRootDir, "settings-export.json");
        const importPath = path.join(tempRootDir, "settings-import.json");

        mockShowSaveDialog.mockResolvedValue({
            canceled: false,
            filePath: exportPath,
        });
        mockShowOpenDialog.mockResolvedValue({
            canceled: false,
            filePaths: [importPath],
        });

        const languageBroadcastSends = [vi.fn(), vi.fn()];
        mockGetAllWindows.mockReturnValue(
            languageBroadcastSends.map((send) => ({
                webContents: {
                    send,
                },
            }))
        );

        const store = new InMemoryStore<AppConfig>(createDefaultAppConfig());

        const [{ registerAppConfigHandlers }, { SettingsRepository }, { WindowRepository }] =
            await Promise.all([
                import("@/main/ipc/appConfig"),
                import("@/main/repositories/SettingsRepository"),
                import("@/main/repositories/WindowRepository"),
            ]);

        registerAppConfigHandlers(
            new SettingsRepository(asElectronStore(store)),
            new WindowRepository(asElectronStore(store))
        );

        return {
            tempRootDir,
            exportPath,
            importPath,
            store,
            languageBroadcastSends,
            cleanup: () =>
                fs.rm(tempRootDir, {
                    recursive: true,
                    force: true,
                }),
        };
    };
