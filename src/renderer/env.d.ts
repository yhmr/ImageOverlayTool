import type { SettingType } from "../shared/types/AppConfig";
import type { ProjectFile } from "../shared/types/ProjectFile";
import type { ImageSet } from "../shared/types/ImageSet";
import type { CaptureResult } from "../../shared/types/CaptureResult";
import type { LicenseInfo } from "../shared/types/LicenseInfo";
import type {
    E2ECaptureRequest,
    E2EControlStatus,
    E2ELoadFixtureImageRequest,
    E2EResolvedFixtureImage,
    E2EResolvedScene,
    E2ESceneInput,
    E2EWaitStableRequest,
    E2EWaitStableResult,
} from "../shared/types/E2EControl";

// APIのインターフェースを定義
export interface IElectronAPI {
    // Logger
    log: {
        debug: (message: string, ...params: unknown[]) => Promise<void>;
        info: (message: string, ...params: unknown[]) => Promise<void>;
        warn: (message: string, ...params: unknown[]) => Promise<void>;
        error: (message: string, ...params: unknown[]) => Promise<void>;
        export: () => Promise<string | null>;
    };
    loadImage: () => Promise<string | null>;
    getPathForFile: (file: File) => string;
    // Window
    switchWindowSize: () => Promise<boolean>;
    setWindowRect: (rect: {
        x: number;
        y: number;
        width: number;
        height: number;
    }) => Promise<void>;
    setIgnoreMouseEvents: (ignore: boolean) => Promise<void>;
    setAlwaysOnTop: (enabled: boolean) => Promise<void>;
    closeWindow: () => Promise<void>;
    // Setting
    loadSetting: () => Promise<SettingType>;
    saveSetting: (setting: SettingType) => Promise<void>;
    exportSettings: () => Promise<string | null>;
    importSettings: () => Promise<SettingType | null>;
    onLanguageUpdated: (callback: (language: string) => void) => () => void;
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
    // Project Dirty Sync
    updateProjectDirty: (isDirty: boolean) => Promise<void>;
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
    // E2E control plane
    getE2EStatus: () => Promise<E2EControlStatus>;
    e2eSetScene: (scene: E2ESceneInput) => Promise<E2EResolvedScene>;
    e2eLoadFixtureImage: (
        request: E2ELoadFixtureImageRequest
    ) => Promise<E2EResolvedFixtureImage>;
    e2eWaitStable: (
        request?: E2EWaitStableRequest
    ) => Promise<E2EWaitStableResult>;
    e2eCapture: (request?: E2ECaptureRequest) => Promise<CaptureResult | null>;
}

export interface IE2EBridgeAPI {
    getStatus: () => Promise<E2EControlStatus>;
    getState: () => {
        imageCount: number;
        dimensionLineCount: number;
        selectedImageId: string | null;
        selectedDimensionLineId: string | null;
        interactionMode: "default" | "dimension";
        unit: "nm" | "um" | "mm";
        unitFactor: number;
        windowColor: string;
        isUIHidden: boolean;
    };
    setScene: (scene: E2ESceneInput) => Promise<E2EWaitStableResult>;
    loadFixtureImage: (
        source: string,
        overrides?: Omit<E2ESceneInput["images"][number], "source">
    ) => Promise<E2EWaitStableResult>;
    waitStable: (
        request?: E2EWaitStableRequest
    ) => Promise<E2EWaitStableResult>;
    capture: (request?: E2ECaptureRequest) => Promise<CaptureResult | null>;
}

declare global {
    interface Window {
        electronAPI: IElectronAPI;
        __IOT_E2E__?: IE2EBridgeAPI;
    }
}

declare module "*.png" {
    const value: string;
    export default value;
}
