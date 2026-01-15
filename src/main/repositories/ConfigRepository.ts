import Store from "electron-store";
import { screen } from "electron";
import {
    AppConfig,
    SettingType,
    DEFAULT_MAIN_WINDOW_SIZE,
    DEFAULT_IMAGE_SETTINGS_WINDOW_SIZE,
} from "../../shared/types/AppConfig";
import { calcCenterPosition } from "../utils/calcCenterPosition";
import { Point } from "../../shared/types/Point";
import { Size } from "../../shared/types/Size";

export interface IConfigRepository {
    loadSettings(): Promise<{ language: string }>;
    saveSettings(settings: SettingType): Promise<void>;
    loadWindowColor(): Promise<string>;
    saveWindowColor(color: string): Promise<void>;
    getWindowPositionAndSize(): { pos: Point; size: Size };
    saveWindowPositionAndSize(pos: number[], size: number[]): void;
    // 画像設定ウィンドウ用
    getImageSettingsWindowPositionAndSize(): { pos: Point; size: Size };
    saveImageSettingsWindowPositionAndSize(pos: number[], size: number[]): void;
}

export class ConfigRepository implements IConfigRepository {
    private store: Store<AppConfig>;

    constructor(store: Store<AppConfig>) {
        this.store = store;
    }

    async loadSettings() {
        return {
            language: this.store.get("setting.language", "en"),
        };
    }

    async saveSettings(settings: SettingType) {
        if (settings.language !== undefined) {
            this.store.set("setting.language", settings.language);
        }
    }

    async loadWindowColor() {
        return this.store.get("window.color", "#FFFFFF55");
    }

    async saveWindowColor(color: string) {
        this.store.set("window.color", color);
    }

    getWindowPositionAndSize(): { pos: Point; size: Size } {
        const defaultPos = this.getDefaultCenterPosition();
        return this.getPositionAndSize(
            "window.pos",
            "window.size",
            DEFAULT_MAIN_WINDOW_SIZE,
            { x: defaultPos[0], y: defaultPos[1] }
        );
    }

    saveWindowPositionAndSize(pos: number[], size: number[]): void {
        this.store.set("window.pos", pos);
        this.store.set("window.size", size);
    }

    getImageSettingsWindowPositionAndSize(): { pos: Point; size: Size } {
        return this.getPositionAndSize(
            "imageSettingsWindow.pos",
            "imageSettingsWindow.size",
            DEFAULT_IMAGE_SETTINGS_WINDOW_SIZE,
            { x: 0, y: 0 }
        );
    }

    saveImageSettingsWindowPositionAndSize(
        pos: number[],
        size: number[]
    ): void {
        this.store.set("imageSettingsWindow.pos", pos);
        this.store.set("imageSettingsWindow.size", size);
    }

    /**
     * ウィンドウの位置とサイズを取得するヘルパーメソッド
     */
    private getPositionAndSize(
        posKey: "window.pos" | "imageSettingsWindow.pos",
        sizeKey: "window.size" | "imageSettingsWindow.size",
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

    private getDefaultCenterPosition() {
        const { width, height } = screen.getPrimaryDisplay().workAreaSize;
        return calcCenterPosition(
            { width, height },
            {
                width: DEFAULT_MAIN_WINDOW_SIZE.width,
                height: DEFAULT_MAIN_WINDOW_SIZE.height,
            }
        );
    }
}
