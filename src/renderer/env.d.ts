import type { SettingType } from "./types/AppConfig";

// APIのインターフェースを定義
interface IElectronAPI {
  openFile: () => Promise<string | undefined>;
  switchWindowSize: () => Promise<boolean>;
  closeWindow: () => Promise<void>;
  loadSetting: () => Promise<SettingType>;
  saveSetting: (setting: SettingType) => Promise<void>;
  loadWindowColor: () => Promise<string>;
  saveWindowColor: (color: string) => Promise<void>;
}

// 既存の Window オブジェクトを拡張
declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
