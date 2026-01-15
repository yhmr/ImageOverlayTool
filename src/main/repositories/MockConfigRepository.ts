import {
  SettingType,
  DEFAULT_MAIN_WINDOW_SIZE,
  DEFAULT_IMAGE_SETTINGS_WINDOW_SIZE,
} from "../../shared/types/AppConfig";
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
    width: DEFAULT_MAIN_WINDOW_SIZE.width,
    height: DEFAULT_MAIN_WINDOW_SIZE.height,
  };
  private imageSettingsWindowPos: Point = { x: 0, y: 0 };
  private imageSettingsWindowSize: Size = {
    width: DEFAULT_IMAGE_SETTINGS_WINDOW_SIZE.width,
    height: DEFAULT_IMAGE_SETTINGS_WINDOW_SIZE.height,
  };

  async loadSettings() {
    return { ...this.settings };
  }

  async saveSettings(settings: SettingType) {
    if (settings.language !== undefined) {
      this.settings.language = settings.language;
    }
  }

  async loadWindowColor() {
    return this.windowColor;
  }

  async saveWindowColor(color: string) {
    this.windowColor = color;
  }

  getWindowPositionAndSize(): { pos: Point; size: Size } {
    return {
      pos: { ...this.windowPos },
      size: { ...this.windowSize },
    };
  }

  saveWindowPositionAndSize(pos: number[], size: number[]): void {
    this.windowPos = { x: pos[0], y: pos[1] };
    this.windowSize = { width: size[0], height: size[1] };
  }

  getImageSettingsWindowPositionAndSize(): { pos: Point; size: Size } {
    return {
      pos: { ...this.imageSettingsWindowPos },
      size: { ...this.imageSettingsWindowSize },
    };
  }

  saveImageSettingsWindowPositionAndSize(pos: number[], size: number[]): void {
    this.imageSettingsWindowPos = { x: pos[0], y: pos[1] };
    this.imageSettingsWindowSize = { width: size[0], height: size[1] };
  }
}
