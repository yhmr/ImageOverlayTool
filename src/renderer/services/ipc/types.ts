import type { SettingType } from "../../../shared/types/AppConfig";
import type { CaptureResult } from "../../../shared/types/CaptureResult";
import type { DimensionLine } from "../../../shared/types/DimensionLine";
import type {
    E2ECaptureRequest,
    E2EControlStatus,
    E2ELoadFixtureImageRequest,
    E2EResolvedFixtureImage,
    E2EResolvedSceneFile,
    E2EWaitStableRequest,
    E2EWaitStableResult,
} from "../../../shared/types/E2EControl";
import type { ImageInfoResult } from "../../../shared/types/ImageInfo";
import type { ImageSet } from "../../../shared/types/ImageSet";
import type { InteractionMode } from "../../../shared/types/InteractionMode";
import type { LicenseInfo } from "../../../shared/types/LicenseInfo";
import type { ProjectFile } from "../../../shared/types/ProjectFile";
import type { ResolvedSceneFile } from "../../../shared/types/SceneFile";

export type Unit = "nm" | "um" | "mm";

export interface ILogIPCService {
    log: {
        debug: (message: string, ...params: unknown[]) => Promise<void>;
        info: (message: string, ...params: unknown[]) => Promise<void>;
        warn: (message: string, ...params: unknown[]) => Promise<void>;
        error: (message: string, ...params: unknown[]) => Promise<void>;
        export: () => Promise<string | null>;
    };
}

export interface IWindowIPCService {
    minimizeWindow: () => Promise<void>;
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
}

export interface ISettingsIPCService {
    loadSetting: () => Promise<SettingType>;
    saveSetting: (setting: SettingType) => Promise<void>;
    exportSettings: () => Promise<string | null>;
    importSettings: () => Promise<SettingType | null>;
    onLanguageUpdated: (callback: (language: string) => void) => () => void;
    loadWindowColor: () => Promise<string>;
    saveWindowColor: (color: string) => Promise<void>;
    loadWindowColorPresets: () => Promise<string[]>;
    saveWindowColorPresets: (presets: string[]) => Promise<void>;
}

export interface IProjectIPCService {
    saveProjectAs: (project: ProjectFile<ImageSet>) => Promise<string | null>;
    pickProjectSavePath: () => Promise<string | null>;
    materializeCacheImages: (
        projectFilePath: string,
        cacheImagePaths: string[]
    ) => Promise<Record<string, string>>;
    saveProject: (
        filePath: string,
        project: ProjectFile<ImageSet>,
        cacheImagePathsToDelete?: string[]
    ) => Promise<boolean>;
    loadProject: () => Promise<{
        project: ProjectFile<ImageSet>;
        filePath: string;
    } | null>;
    loadProjectFromPath: (
        filePath: string
    ) => Promise<{ project: ProjectFile<ImageSet>; filePath: string } | null>;
    loadSceneFromPath: (filePath: string) => Promise<ResolvedSceneFile>;
}

export interface IImageSettingsWindowIPCService {
    loadImage: () => Promise<string | null>;
    getImageInfo: (imagePath: string) => Promise<ImageInfoResult>;
    pasteImage: () => Promise<string | null>;
    saveCacheImageAs: (cacheFilePath: string) => Promise<string | null>;
    getPathForFile: (file: File) => string;
    toggleImageSettingsWindow: () => Promise<boolean>;
    toggleDimensionSettingsWindow: () => Promise<boolean>;
}

export interface IImageSyncIPCService {
    updateImageSets(imageSets: ImageSet[]): Promise<void>;
    onImageSetsUpdated: (
        callback: (imageSets: ImageSet[]) => void
    ) => () => void;
}

export interface IDimensionLineSyncIPCService {
    updateDimensionLines(dimensionLines: DimensionLine[]): Promise<void>;
    onDimensionLinesUpdated: (
        callback: (dimensionLines: DimensionLine[]) => void
    ) => () => void;
}

export interface IUnitSyncIPCService {
    updateUnitFactor(factor: number): Promise<void>;
    onUnitFactorUpdated: (callback: (factor: number) => void) => () => void;
    updateUnit(unit: Unit): Promise<void>;
    onUnitUpdated: (callback: (unit: Unit) => void) => () => void;
}

export interface IInteractionModeSyncIPCService {
    updateInteractionMode(mode: InteractionMode): Promise<void>;
    onInteractionModeUpdated: (
        callback: (mode: InteractionMode) => void
    ) => () => void;
}

export interface IStateSyncIPCService {
    requestInitialState: () => Promise<void>;
    onRequestStateSync: (callback: () => void) => () => void;
    onAlwaysOnTopShortcutTriggered: (callback: () => void) => () => void;
    onClickThroughShortcutTriggered: (callback: () => void) => () => void;
    onFileOpen: (
        callback: (filePath: string, ext: string) => void
    ) => () => void;
}

export interface ILicenseIPCService {
    getLicenseInfo: () => Promise<LicenseInfo[]>;
    getAppVersion: () => Promise<string>;
}

export interface ICaptureIPCService {
    captureScreen: () => Promise<CaptureResult>;
    captureWindow: () => Promise<CaptureResult>;
    saveImage: (dataUrl: string) => Promise<string | null>;
}

export interface ISelectedImageSyncIPCService {
    updateSelectedImageId(id: string | null): Promise<void>;
    onSelectedImageIdUpdated: (
        callback: (id: string | null) => void
    ) => () => void;
}

export interface ISelectedDimensionLineSyncIPCService {
    updateSelectedDimensionLineId(id: string | null): Promise<void>;
    onSelectedDimensionLineIdUpdated: (
        callback: (id: string | null) => void
    ) => () => void;
}

export interface IProjectDirtySyncIPCService {
    updateProjectDirty(isDirty: boolean): Promise<void>;
}

export interface IE2EIPCService {
    getE2EStatus(): Promise<E2EControlStatus>;
    e2eSetSceneFromPath(scenePath: string): Promise<E2EResolvedSceneFile>;
    e2eLoadFixtureImage(
        request: E2ELoadFixtureImageRequest
    ): Promise<E2EResolvedFixtureImage>;
    e2eWaitStable(request?: E2EWaitStableRequest): Promise<E2EWaitStableResult>;
    e2eCapture(request?: E2ECaptureRequest): Promise<CaptureResult | null>;
}

export interface IProjectDataSyncIPCService {
    updateImageSets(imageSets: ImageSet[]): Promise<void>;
    updateDimensionLines(dimensionLines: DimensionLine[]): Promise<void>;
    updateUnitFactor(factor: number): Promise<void>;
    updateUnit(unit: Unit): Promise<void>;
}

export interface IIPCService
    extends ILogIPCService,
        IWindowIPCService,
        ISettingsIPCService,
        IProjectIPCService,
        IImageSettingsWindowIPCService,
        IImageSyncIPCService,
        IDimensionLineSyncIPCService,
        IUnitSyncIPCService,
        IInteractionModeSyncIPCService,
        IStateSyncIPCService,
        ILicenseIPCService,
        ICaptureIPCService,
        ISelectedImageSyncIPCService,
        ISelectedDimensionLineSyncIPCService,
        IProjectDirtySyncIPCService,
        IE2EIPCService {}
