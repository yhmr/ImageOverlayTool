import type { Point } from "./Point";
import type { Size } from "./Size";

// 設定ファイルの型定義
export interface AppConfig {
  window: {
    pos: Point;
    size: Size;
    color: string;
  };
  setting: SettingType;
}

// 設定の型定義
// Note: settingはUI上で操作可能な値を示す
export interface SettingType {
  language: string;
}

// ウィンドウのデフォルトサイズ
export const DEFAULT_SIZE = {
  width: 800,
  height: 600,
};
