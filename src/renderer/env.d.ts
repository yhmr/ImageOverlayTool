import type { SettingType } from "../shared/types/AppConfig";
import type { ProjectFile } from "../shared/types/ProjectFile";

// APIのインターフェースを定義
export interface IElectronAPI {
  openFile: () => Promise<string | null>;
  // Window
  switchWindowSize: () => Promise<boolean>;
  setWindowRect: (rect: { x: number; y: number; width: number; height: number }) => Promise<void>;
  closeWindow: () => Promise<void>;
  // Setting
  loadSetting: () => Promise<SettingType>;
  saveSetting: (setting: SettingType) => void;
  // Window Color
  loadWindowColor: () => Promise<string>;
  saveWindowColor: (color: string) => Promise<void>;
  // Project
  loadProject: () => Promise<{ project: ProjectFile; filePath: string } | null>;
  saveProject: (filePath: string, project: ProjectFile) => Promise<void>;
  saveProjectAs: (project: ProjectFile) => Promise<string | null>;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
