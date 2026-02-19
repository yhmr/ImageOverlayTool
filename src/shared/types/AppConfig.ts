import type { Point } from "./Point";
import type { Size } from "./Size";

// ウィンドウ設定の型定義
export interface WindowConfig {
    pos: Point;
    size: Size;
}

// 設定ファイルの型定義
export interface AppConfig {
    window: WindowConfig & {
        color: string;
    };
    imageSettingsWindow: WindowConfig;
    dimensionSettingsWindow: WindowConfig;
    setting: SettingType;
}

// 設定の型定義
// Note: settingはUI上で操作可能な値を示す
export interface SettingType {
    language: string;
    logLevel: string;
}

// 設定のインポート/エクスポートで扱うスナップショット
export interface SettingsSnapshot {
    version: 1;
    exportedAt: string;
    setting: SettingType;
    window: {
        color: string;
    };
}

// メインウィンドウのデフォルトサイズ
export const DEFAULT_MAIN_WINDOW_SIZE: Size = {
    width: 800,
    height: 600,
};

// 画像設定ウィンドウのデフォルトサイズ
export const DEFAULT_IMAGE_SETTINGS_WINDOW_SIZE: Size = {
    width: 400,
    height: 500,
};

// 画像設定ウィンドウの最小サイズ（文言つぶれ防止）
export const MIN_IMAGE_SETTINGS_WINDOW_SIZE: Size = {
    width: DEFAULT_IMAGE_SETTINGS_WINDOW_SIZE.width,
    height: DEFAULT_IMAGE_SETTINGS_WINDOW_SIZE.height,
};

// 寸法線設定ウィンドウのデフォルトサイズ
export const DEFAULT_DIMENSION_SETTINGS_WINDOW_SIZE: Size = {
    width: 460,
    height: 560,
};

// 寸法線設定ウィンドウの最小サイズ
export const MIN_DIMENSION_SETTINGS_WINDOW_SIZE: Size = {
    width: DEFAULT_DIMENSION_SETTINGS_WINDOW_SIZE.width,
    height: DEFAULT_DIMENSION_SETTINGS_WINDOW_SIZE.height,
};
