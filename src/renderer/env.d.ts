import type { SettingType } from "../shared/types/AppConfig";
import type { ProjectFile } from "../shared/types/ProjectFile";
import type { ImageSet } from "./types/ImageSet";

// APIのインターフェースを定義
export interface IElectronAPI {
  loadImage: () => Promise<string | null>;
  // Window
  switchWindowSize: () => Promise<boolean>;
  setWindowRect: (rect: {
    x: number;
    y: number;
    width: number;
    height: number;
  }) => Promise<void>;
  closeWindow: () => Promise<void>;
  // Setting
  loadSetting: () => Promise<SettingType>;
  saveSetting: (setting: SettingType) => void;
  // Window Color
  loadWindowColor: () => Promise<string>;
  saveWindowColor: (color: string) => Promise<void>;
  // Project
  loadProject: () => Promise<{ project: ProjectFile; filePath: string } | null>;
  loadProjectFromPath: (
    filePath: string
  ) => Promise<{ project: ProjectFile; filePath: string } | null>;
  saveProject: (filePath: string, project: ProjectFile) => Promise<void>;
  saveProjectAs: (project: ProjectFile) => Promise<string | null>;
  // Image Settings Window
  toggleImageSettingsWindow: () => Promise<boolean>;
  // ImageSets Sync
  updateImageSets: (imageSets: ImageSet[]) => Promise<void>;
  onImageSetsUpdated: (callback: (imageSets: ImageSet[]) => void) => () => void;
  // Unit Factor Sync
  updateUnitFactor: (unitFactor: number) => Promise<void>;
  onUnitFactorUpdated: (callback: (unitFactor: number) => void) => () => void;
  // Initial State Sync
  requestInitialState: () => Promise<void>;
  onRequestStateSync: (callback: () => void) => () => void;
  // File Open
  onFileOpen: (callback: (filePath: string, ext: string) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
