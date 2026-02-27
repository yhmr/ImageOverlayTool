import type Store from "electron-store";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("electron", () => ({
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

import {
    DEFAULT_IMAGE_SETTINGS_WINDOW_SIZE,
    DEFAULT_DIMENSION_SETTINGS_WINDOW_SIZE,
    DEFAULT_WINDOW_COLOR,
    DEFAULT_WINDOW_COLOR_PRESETS,
} from "@/shared/types/AppConfig";
import { WindowRepository } from "@/main/repositories/WindowRepository";
import { SettingsRepository } from "@/main/repositories/SettingsRepository";
import type { AppConfig, SettingsSnapshot } from "@/shared/types/AppConfig";

class InMemoryStore<T extends object> {
    private data: Record<string, unknown>;

    constructor(initialData: Partial<T> = {}) {
        this.data = initialData as Record<string, unknown>;
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

describe("Main integration: repository branches", () => {
    let store: InMemoryStore<AppConfig>;
    let windowRepository: WindowRepository;
    let settingsRepository: SettingsRepository;

    beforeEach(() => {
        store = new InMemoryStore<AppConfig>({
            setting: {
                language: "ja",
                logLevel: "info",
            },
            window: {
                pos: { x: 0, y: 0 },
                size: { width: 800, height: 600 },
                color: DEFAULT_WINDOW_COLOR,
                colorPresets: [...DEFAULT_WINDOW_COLOR_PRESETS],
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
        windowRepository = new WindowRepository(asElectronStore(store));
        settingsRepository = new SettingsRepository(asElectronStore(store));
    });

    it("WindowRepository uses centered defaults when stored pos/size are invalid", () => {
        store.set("window.pos", "invalid");
        store.set("window.size", "invalid");
        store.set("window.isMaximized", undefined);

        const loaded = windowRepository.getWindowPositionAndSize();

        expect(loaded).toEqual({
            pos: { x: 560, y: 240 },
            size: { width: 800, height: 600 },
            isMaximized: false,
        });
    });

    it("WindowRepository uses stored arrays and maximized flag", () => {
        windowRepository.saveWindowPositionAndSize([100, 200], [900, 700], true);

        const loaded = windowRepository.getWindowPositionAndSize();

        expect(loaded).toEqual({
            pos: { x: 100, y: 200 },
            size: { width: 900, height: 700 },
            isMaximized: true,
        });
    });

    it("WindowRepository clamps image settings window size to minimum", () => {
        windowRepository.saveImageSettingsWindowPositionAndSize([10, 20], [10, 20]);

        const loaded = windowRepository.getImageSettingsWindowPositionAndSize();

        expect(loaded).toEqual({
            pos: { x: 10, y: 20 },
            size: DEFAULT_IMAGE_SETTINGS_WINDOW_SIZE,
        });
    });

    it("WindowRepository clamps dimension settings window size to minimum", () => {
        windowRepository.saveDimensionSettingsWindowPositionAndSize(
            [40, 50],
            [100, 100]
        );

        const loaded =
            windowRepository.getDimensionSettingsWindowPositionAndSize();

        expect(loaded).toEqual({
            pos: { x: 40, y: 50 },
            size: DEFAULT_DIMENSION_SETTINGS_WINDOW_SIZE,
        });
    });

    it("WindowRepository applies default presets when appConfig has no presets", async () => {
        store.set("window.colorPresets", undefined);

        const loadedPresets = await windowRepository.loadWindowColorPresets();

        expect(loadedPresets).toEqual([...DEFAULT_WINDOW_COLOR_PRESETS]);
        expect(store.get("window.colorPresets")).toEqual([
            ...DEFAULT_WINDOW_COLOR_PRESETS,
        ]);
    });

    it("WindowRepository keeps explicit empty preset list", async () => {
        store.set("window.colorPresets", []);

        const loadedPresets = await windowRepository.loadWindowColorPresets();

        expect(loadedPresets).toEqual([]);
        expect(store.get("window.colorPresets")).toEqual([]);
    });

    it("WindowRepository normalizes invalid color and writes back to store", async () => {
        store.set("window.color", "invalid-color");

        const loadedColor = await windowRepository.loadWindowColor();

        expect(loadedColor).toBe(DEFAULT_WINDOW_COLOR);
        expect(store.get("window.color")).toBe(DEFAULT_WINDOW_COLOR);
    });

    it("SettingsRepository normalizes language on load", async () => {
        store.set("setting.language", "EN-us");
        store.set("setting.logLevel", "warn");

        const loadedSettings = await settingsRepository.loadSettings();

        expect(loadedSettings).toEqual({
            language: "en",
            logLevel: "warn",
        });
    });

    it("SettingsRepository normalizes language on save", async () => {
        await settingsRepository.saveSettings({
            language: "ja-JP",
            logLevel: "error",
        });
        const loadedSettings = await settingsRepository.loadSettings();

        expect(loadedSettings).toEqual({
            language: "ja",
            logLevel: "error",
        });
    });

    it("SettingsRepository loads and saves window frame visibility", async () => {
        await settingsRepository.saveSettings({
            language: "ja",
            logLevel: "info",
            showWindowFrame: true,
        });
        let loadedSettings = await settingsRepository.loadSettings();

        expect(loadedSettings).toEqual({
            language: "ja",
            logLevel: "info",
            showWindowFrame: true,
        });

        await settingsRepository.saveSettings({
            language: "ja",
            logLevel: "info",
            showWindowFrame: false,
        });
        loadedSettings = await settingsRepository.loadSettings();

        expect(loadedSettings).toEqual({
            language: "ja",
            logLevel: "info",
            showWindowFrame: false,
        });
    });

    it("SettingsRepository import ignores invalid optional fields and keeps existing values", async () => {
        store.set("setting.language", "en");
        store.set("setting.logLevel", "info");
        store.set("window.color", "#11111111");

        const invalidSnapshot = {
            version: 1,
            exportedAt: new Date().toISOString(),
            setting: {
                language: 123,
                logLevel: null,
            },
            window: {
                color: "#55667788",
            },
        } as unknown as SettingsSnapshot;

        await settingsRepository.importSettingsSnapshot(invalidSnapshot);
        const loaded = await settingsRepository.loadSettings();

        expect(loaded).toEqual({
            language: "en",
            logLevel: "info",
        });
        expect(store.get("window.color")).toBe("#55667788");
    });

    it("SettingsRepository export normalizes corrupted presets and persists them", async () => {
        store.set("window.colorPresets", ["#FFFFFF", "bad", "#ffffff", 123]);

        const snapshot = await settingsRepository.exportSettingsSnapshot();

        expect(snapshot.window.colorPresets).toEqual(["#FFFFFF"]);
        expect(store.get("window.colorPresets")).toEqual(["#FFFFFF"]);
    });

    it("SettingsRepository export/import preserves window frame visibility", async () => {
        store.set("setting.showWindowFrame", true);

        const exported = await settingsRepository.exportSettingsSnapshot();
        expect(exported.setting.showWindowFrame).toBe(true);

        await settingsRepository.importSettingsSnapshot({
            ...exported,
            setting: {
                ...exported.setting,
                showWindowFrame: false,
            },
        });

        const loaded = await settingsRepository.loadSettings();
        expect(loaded.showWindowFrame).toBe(false);
    });
});
