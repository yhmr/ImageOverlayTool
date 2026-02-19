import {
    DEFAULT_MAIN_WINDOW_SIZE,
    DEFAULT_IMAGE_SETTINGS_WINDOW_SIZE,
    DEFAULT_DIMENSION_SETTINGS_WINDOW_SIZE,
} from "@/shared/types/AppConfig";
import { Point } from "@/shared/types/Point";
import { Size } from "@/shared/types/Size";
import { IWindowRepository } from "@/main/repositories/WindowRepository";

export class MockWindowRepository implements IWindowRepository {
    private windowColor = "#FF000055"; // テストだと分かりやすいように赤にしておく
    private windowPos: Point = { x: 100, y: 100 };
    private windowSize: Size = {
        width: DEFAULT_MAIN_WINDOW_SIZE.width,
        height: DEFAULT_MAIN_WINDOW_SIZE.height,
    };
    private isMaximized = false;
    private imageSettingsWindowPos: Point = { x: 0, y: 0 };
    private imageSettingsWindowSize: Size = {
        width: DEFAULT_IMAGE_SETTINGS_WINDOW_SIZE.width,
        height: DEFAULT_IMAGE_SETTINGS_WINDOW_SIZE.height,
    };
    private dimensionSettingsWindowPos: Point = { x: 40, y: 40 };
    private dimensionSettingsWindowSize: Size = {
        width: DEFAULT_DIMENSION_SETTINGS_WINDOW_SIZE.width,
        height: DEFAULT_DIMENSION_SETTINGS_WINDOW_SIZE.height,
    };

    async loadWindowColor(): Promise<string> {
        return this.windowColor;
    }

    async saveWindowColor(color: string): Promise<void> {
        this.windowColor = color;
    }

    getWindowPositionAndSize(): { pos: Point; size: Size; isMaximized: boolean } {
        return {
            pos: { ...this.windowPos },
            size: { ...this.windowSize },
            isMaximized: this.isMaximized,
        };
    }

    saveWindowPositionAndSize(pos: number[], size: number[], isMaximized: boolean): void {
        this.windowPos = { x: pos[0], y: pos[1] };
        this.windowSize = { width: size[0], height: size[1] };
        this.isMaximized = isMaximized;
    }

    getImageSettingsWindowPositionAndSize(): { pos: Point; size: Size } {
        return {
            pos: { ...this.imageSettingsWindowPos },
            size: { ...this.imageSettingsWindowSize },
        };
    }

    saveImageSettingsWindowPositionAndSize(
        pos: number[],
        size: number[]
    ): void {
        this.imageSettingsWindowPos = { x: pos[0], y: pos[1] };
        this.imageSettingsWindowSize = { width: size[0], height: size[1] };
    }

    getDimensionSettingsWindowPositionAndSize(): { pos: Point; size: Size } {
        return {
            pos: { ...this.dimensionSettingsWindowPos },
            size: { ...this.dimensionSettingsWindowSize },
        };
    }

    saveDimensionSettingsWindowPositionAndSize(
        pos: number[],
        size: number[]
    ): void {
        this.dimensionSettingsWindowPos = { x: pos[0], y: pos[1] };
        this.dimensionSettingsWindowSize = { width: size[0], height: size[1] };
    }
}
