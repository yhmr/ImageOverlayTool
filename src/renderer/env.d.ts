import type { SettingType } from "../shared/types/AppConfig";
import type { ProjectFile } from "../shared/types/ProjectFile";

// APIのインターフェースを定義
interface IElectronAPI {
  openFile: () => Promise<string | undefined>;
  switchWindowSize: () => Promise<boolean>;
  setWindowRect: (rect: { x: number; y: number; width: number; height: number }) => Promise<void>;
  closeWindow: () => Promise<void>;
  loadSetting: () => Promise<SettingType>;
  saveSetting: (setting: SettingType) => Promise<void>;
  loadWindowColor: () => Promise<string>;
  saveWindowColor: (color: string) => Promise<void>;
  saveProjectAs: (project: ProjectFile) => Promise<string | null>;
  saveProject: (filePath: string, project: ProjectFile) => Promise<boolean>;
  loadProject: () => Promise<{ project: ProjectFile; filePath: string } | null>;
}

// 既存の Window オブジェクトを拡張
declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
