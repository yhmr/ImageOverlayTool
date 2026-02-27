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
        colorPresets: string[];
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
    showWindowFrame?: boolean;
}

// 設定のインポート/エクスポートで扱うスナップショット
export interface SettingsSnapshot {
    version: 1;
    exportedAt: string;
    setting: SettingType;
    window: {
        color: string;
        colorPresets?: string[];
    };
}

export const DEFAULT_WINDOW_COLOR = "#FFFFFF55";
export const DEFAULT_SHOW_WINDOW_FRAME = false;
export const DEFAULT_WINDOW_COLOR_PRESETS = [
    "#00000000",
    "#FFFFFF",
    "#000000",
] as const;

const WINDOW_COLOR_PATTERN =
    /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

export const isValidWindowColor = (value: unknown): value is string => {
    return typeof value === "string" && WINDOW_COLOR_PATTERN.test(value.trim());
};

export const normalizeWindowColor = (value: unknown): string => {
    return isValidWindowColor(value) ? value.trim() : DEFAULT_WINDOW_COLOR;
};

export const normalizeWindowColorPresets = (value: unknown): string[] => {
    if (!Array.isArray(value)) {
        return [...DEFAULT_WINDOW_COLOR_PRESETS];
    }

    const normalized: string[] = [];
    const seen = new Set<string>();

    for (const candidate of value) {
        if (!isValidWindowColor(candidate)) {
            continue;
        }
        const normalizedColor = candidate.trim();
        const key = normalizedColor.toLowerCase();
        if (seen.has(key)) {
            continue;
        }
        seen.add(key);
        normalized.push(normalizedColor);
    }

    if (normalized.length === 0) {
        return value.length === 0 ? [] : [...DEFAULT_WINDOW_COLOR_PRESETS];
    }

    return normalized;
};

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
