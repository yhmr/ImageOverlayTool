import { SettingType, DEFAULT_SIZE } from "../../shared/types/AppConfig";
import { Point } from "../../shared/types/Point";
import { Size } from "../../shared/types/Size";
import { IConfigRepository } from "./ConfigRepository"; // 同じディレクトリにあるConfigRepositoryからインターフェースをインポート

export class MockConfigRepository implements IConfigRepository {
    // メモリ上で値を保持する（アプリを再起動するとリセットされる）
    private settings = {
        language: "en",
    };
    private windowColor = "#FF000055"; // テストだと分かりやすいように赤にしておく
    private windowPos: Point = { x: 100, y: 100 };
    private windowSize: Size = {
        width: DEFAULT_SIZE.width,
        height: DEFAULT_SIZE.height,
    };

    async loadSettings() {
        console.log("[Mock] Loading settings...");
        return { ...this.settings };
    }

    async saveSettings(settings: SettingType) {
        console.log("[Mock] Saving settings:", settings);
        if (settings.language !== undefined) {
            this.settings.language = settings.language;
        }
    }

    async loadWindowColor() {
        console.log("[Mock] Loading window color...");
        return this.windowColor;
    }

    async saveWindowColor(color: string) {
        console.log("[Mock] Saving window color:", color);
        this.windowColor = color;
    }

    getWindowPositionAndSize(): { pos: Point; size: Size } {
        console.log("[Mock] Getting window pos/size...");
        return {
            pos: { ...this.windowPos },
            size: { ...this.windowSize },
        };
    }

    saveWindowPositionAndSize(pos: number[], size: number[]): void {
        console.log("[Mock] Saving window pos/size:", pos, size);
        this.windowPos = { x: pos[0], y: pos[1] };
        this.windowSize = { width: size[0], height: size[1] };
    }
}
