import Store from "electron-store";
import { screen } from "electron";
import {
    AppConfig,
    DEFAULT_MAIN_WINDOW_SIZE,
    DEFAULT_IMAGE_SETTINGS_WINDOW_SIZE,
    DEFAULT_DIMENSION_SETTINGS_WINDOW_SIZE,
    MIN_IMAGE_SETTINGS_WINDOW_SIZE,
    MIN_DIMENSION_SETTINGS_WINDOW_SIZE,
    normalizeWindowColor,
    normalizeWindowColorPresets,
} from "../../shared/types/AppConfig";
import { calcCenterPosition } from "../utils/calcCenterPosition";
import { Point } from "../../shared/types/Point";
import { Size } from "../../shared/types/Size";

export interface IWindowRepository {
    loadWindowColor(): Promise<string>;
    saveWindowColor(color: string): Promise<void>;
    loadWindowColorPresets(): Promise<string[]>;
    saveWindowColorPresets(presets: string[]): Promise<void>;
    getWindowPositionAndSize(): {
        pos: Point;
        size: Size;
        isMaximized: boolean;
    };
    saveWindowPositionAndSize(
        pos: number[],
        size: number[],
        isMaximized: boolean
    ): void;
    getImageSettingsWindowPositionAndSize(): { pos: Point; size: Size };
    saveImageSettingsWindowPositionAndSize(pos: number[], size: number[]): void;
    getDimensionSettingsWindowPositionAndSize(): { pos: Point; size: Size };
    saveDimensionSettingsWindowPositionAndSize(
        pos: number[],
        size: number[]
    ): void;
}

export class WindowRepository implements IWindowRepository {
    private store: Store<AppConfig>;

    constructor(store: Store<AppConfig>) {
        this.store = store;
    }

    async loadWindowColor(): Promise<string> {
        const rawColor = this.store.get("window.color");
        const color = normalizeWindowColor(rawColor);
        if (rawColor !== color) {
            this.store.set("window.color", color);
        }
        return color;
    }

    async saveWindowColor(color: string): Promise<void> {
        this.store.set("window.color", normalizeWindowColor(color));
    }

    async loadWindowColorPresets(): Promise<string[]> {
        const rawPresets = this.store.get("window.colorPresets");
        const presets = normalizeWindowColorPresets(rawPresets);
        if (this.shouldPersistNormalizedPresets(rawPresets, presets)) {
            this.store.set("window.colorPresets", presets);
        }
        return presets;
    }

    async saveWindowColorPresets(presets: string[]): Promise<void> {
        this.store.set(
            "window.colorPresets",
            normalizeWindowColorPresets(presets)
        );
    }

    getWindowPositionAndSize(): {
        pos: Point;
        size: Size;
        isMaximized: boolean;
    } {
        const defaultPos = this.getDefaultCenterPosition();
        const { pos, size } = this.getPositionAndSize(
            "window.pos",
            "window.size",
            DEFAULT_MAIN_WINDOW_SIZE,
            { x: defaultPos[0], y: defaultPos[1] }
        );
        const isMaximized = this.store.get("window.isMaximized", false);
        return { pos, size, isMaximized };
    }

    saveWindowPositionAndSize(
        pos: number[],
        size: number[],
        isMaximized: boolean
    ): void {
        this.store.set("window.pos", pos);
        this.store.set("window.size", size);
        this.store.set("window.isMaximized", isMaximized);
    }

    getImageSettingsWindowPositionAndSize(): { pos: Point; size: Size } {
        const { pos, size } = this.getPositionAndSize(
            "imageSettingsWindow.pos",
            "imageSettingsWindow.size",
            DEFAULT_IMAGE_SETTINGS_WINDOW_SIZE,
            { x: 0, y: 0 }
        );

        return {
            pos,
            size: {
                width: Math.max(
                    size.width,
                    MIN_IMAGE_SETTINGS_WINDOW_SIZE.width
                ),
                height: Math.max(
                    size.height,
                    MIN_IMAGE_SETTINGS_WINDOW_SIZE.height
                ),
            },
        };
    }

    saveImageSettingsWindowPositionAndSize(
        pos: number[],
        size: number[]
    ): void {
        this.store.set("imageSettingsWindow.pos", pos);
        this.store.set("imageSettingsWindow.size", size);
    }

    getDimensionSettingsWindowPositionAndSize(): { pos: Point; size: Size } {
        const { pos, size } = this.getPositionAndSize(
            "dimensionSettingsWindow.pos",
            "dimensionSettingsWindow.size",
            DEFAULT_DIMENSION_SETTINGS_WINDOW_SIZE,
            { x: 40, y: 40 }
        );

        return {
            pos,
            size: {
                width: Math.max(
                    size.width,
                    MIN_DIMENSION_SETTINGS_WINDOW_SIZE.width
                ),
                height: Math.max(
                    size.height,
                    MIN_DIMENSION_SETTINGS_WINDOW_SIZE.height
                ),
            },
        };
    }

    saveDimensionSettingsWindowPositionAndSize(
        pos: number[],
        size: number[]
    ): void {
        this.store.set("dimensionSettingsWindow.pos", pos);
        this.store.set("dimensionSettingsWindow.size", size);
    }

    /**
     * ウィンドウの位置とサイズを取得するヘルパーメソッド
     */
    private getPositionAndSize(
        posKey:
            | "window.pos"
            | "imageSettingsWindow.pos"
            | "dimensionSettingsWindow.pos",
        sizeKey:
            | "window.size"
            | "imageSettingsWindow.size"
            | "dimensionSettingsWindow.size",
        defaultSize: Size,
        defaultPos: Point
    ): { pos: Point; size: Size } {
        const storedPos = this.store.get(posKey);
        const [x, y] = Array.isArray(storedPos)
            ? storedPos
            : [defaultPos.x, defaultPos.y];

        const storedSize = this.store.get(sizeKey);
        const [width, height] = Array.isArray(storedSize)
            ? storedSize
            : [defaultSize.width, defaultSize.height];

        return {
            pos: { x, y },
            size: { width, height },
        };
    }

    private getDefaultCenterPosition(): number[] {
        const { width, height } = screen.getPrimaryDisplay().workAreaSize;
        return calcCenterPosition(
            { width, height },
            {
                width: DEFAULT_MAIN_WINDOW_SIZE.width,
                height: DEFAULT_MAIN_WINDOW_SIZE.height,
            }
        );
    }

    private shouldPersistNormalizedPresets(
        rawPresets: unknown,
        normalizedPresets: string[]
    ): boolean {
        if (!Array.isArray(rawPresets)) {
            return true;
        }

        if (rawPresets.length !== normalizedPresets.length) {
            return true;
        }

        for (let i = 0; i < rawPresets.length; i += 1) {
            if (rawPresets[i] !== normalizedPresets[i]) {
                return true;
            }
        }
        return false;
    }
}
