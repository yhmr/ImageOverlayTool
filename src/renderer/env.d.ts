import type { SettingType } from "../shared/types/AppConfig";
import type { ProjectFile } from "../shared/types/ProjectFile";
import type { ImageSet } from "../shared/types/ImageSet";
import type { CaptureResult } from "../../shared/types/CaptureResult";
import type { LicenseInfo } from "../shared/types/LicenseInfo";

// APIのインターフェースを定義
export interface IElectronAPI {
    // Logger
    log: {
        debug: (message: string, ...params: unknown[]) => Promise<void>;
        info: (message: string, ...params: unknown[]) => Promise<void>;
        warn: (message: string, ...params: unknown[]) => Promise<void>;
        error: (message: string, ...params: unknown[]) => Promise<void>;
    };
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
    saveSetting: (setting: SettingType) => Promise<void>;
    // Window Color
    loadWindowColor: () => Promise<string>;
    saveWindowColor: (color: string) => Promise<void>;
    // Project
    loadProject: () => Promise<{
        project: ProjectFile<ImageSet>;
        filePath: string;
    } | null>;
    loadProjectFromPath: (
        filePath: string
    ) => Promise<{ project: ProjectFile<ImageSet>; filePath: string } | null>;
    saveProject: (
        filePath: string,
        project: ProjectFile<ImageSet>
    ) => Promise<boolean>;
    saveProjectAs: (project: ProjectFile<ImageSet>) => Promise<string | null>;
    // Image Settings Window
    toggleImageSettingsWindow: () => Promise<boolean>;
    // ImageSets Sync
    updateImageSets: (imageSets: ImageSet[]) => Promise<void>;
    onImageSetsUpdated: (
        callback: (imageSets: ImageSet[]) => void
    ) => () => void;
    // Unit sync
    updateUnit: (unit: "nm" | "um" | "mm") => Promise<void>;
    onUnitUpdated: (callback: (unit: "nm" | "um" | "mm") => void) => () => void;
    // Unit Factor Sync
    updateUnitFactor: (unitFactor: number) => Promise<void>;
    onUnitFactorUpdated: (callback: (unitFactor: number) => void) => () => void;
    // Selected Image Sync
    updateSelectedImageId: (id: string | null) => Promise<void>;
    onSelectedImageIdUpdated: (
        callback: (id: string | null) => void
    ) => () => void;
    // Initial State Sync
    requestInitialState: () => Promise<void>;
    onRequestStateSync: (callback: () => void) => () => void;
    // File Open
    onFileOpen: (
        callback: (filePath: string, ext: string) => void
    ) => () => void;
    // License
    getLicenseInfo: () => Promise<LicenseInfo[]>;
    // App Version
    getAppVersion: () => Promise<string>;
    // Capture
    captureScreen: () => Promise<CaptureResult>;
    captureWindow: () => Promise<CaptureResult>;
    saveImage: (dataUrl: string) => Promise<string | null>;
}

declare global {
    interface Window {
        electronAPI: IElectronAPI;
    }
}

declare module "*.png" {
    const value: string;
    export default value;
}
