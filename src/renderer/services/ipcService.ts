/**
 * IPC通信を抽象化するサービスレイヤー
 * window.electronAPIへのアクセスをラップし、テスト時のモック化を容易にする
 */

import type { ImageSet } from "../../shared/types/ImageSet";
import type { ImageInfoResult } from "../../shared/types/ImageInfo";
import type { DimensionLine } from "../../shared/types/DimensionLine";
import type { ProjectFile } from "../../shared/types/ProjectFile";
import type { SettingType } from "../../shared/types/AppConfig";
import type { CaptureResult } from "../../shared/types/CaptureResult";
import type { LicenseInfo } from "../../shared/types/LicenseInfo";
import type { InteractionMode } from "../../shared/types/InteractionMode";
import type {
    E2ECaptureRequest,
    E2EControlStatus,
    E2ELoadFixtureImageRequest,
    E2EResolvedFixtureImage,
    E2EResolvedScene,
    E2ESceneInput,
    E2EWaitStableRequest,
    E2EWaitStableResult,
} from "../../shared/types/E2EControl";
/**
 * IPCサービスのドメイン別インターフェース
 */
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
    e2eSetScene(scene: E2ESceneInput): Promise<E2EResolvedScene>;
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

/**
 * IPCサービスの統合インターフェース
 */
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
/**
 * 実際のElectron IPC通信を行う service
 */
class IPCService implements IIPCService {
    log = {
        debug: (message: string, ...params: unknown[]) =>
            window.electronAPI.log.debug(message, ...params),
        info: (message: string, ...params: unknown[]) =>
            window.electronAPI.log.info(message, ...params),
        warn: (message: string, ...params: unknown[]) =>
            window.electronAPI.log.warn(message, ...params),
        error: (message: string, ...params: unknown[]) =>
            window.electronAPI.log.error(message, ...params),
        export: () => window.electronAPI.log.export(),
    };

    async switchWindowSize(): Promise<boolean> {
        return await window.electronAPI.switchWindowSize();
    }

    async setWindowRect(rect: {
        x: number;
        y: number;
        width: number;
        height: number;
    }): Promise<void> {
        await window.electronAPI.setWindowRect(rect);
    }

    async setIgnoreMouseEvents(ignore: boolean): Promise<void> {
        await window.electronAPI.setIgnoreMouseEvents(ignore);
    }

    async setAlwaysOnTop(enabled: boolean): Promise<void> {
        await window.electronAPI.setAlwaysOnTop(enabled);
    }

    async closeWindow(): Promise<void> {
        await window.electronAPI.closeWindow();
    }

    async loadSetting(): Promise<SettingType> {
        return await window.electronAPI.loadSetting();
    }

    async saveSetting(setting: SettingType): Promise<void> {
        await window.electronAPI.saveSetting(setting);
    }

    async exportSettings(): Promise<string | null> {
        return await window.electronAPI.exportSettings();
    }

    async importSettings(): Promise<SettingType | null> {
        return await window.electronAPI.importSettings();
    }

    onLanguageUpdated(callback: (language: string) => void): () => void {
        return window.electronAPI.onLanguageUpdated(callback);
    }

    async loadWindowColor(): Promise<string> {
        return await window.electronAPI.loadWindowColor();
    }

    async saveWindowColor(color: string): Promise<void> {
        await window.electronAPI.saveWindowColor(color);
    }

    async saveProjectAs(
        project: ProjectFile<ImageSet>
    ): Promise<string | null> {
        return await window.electronAPI.saveProjectAs(project);
    }

    async pickProjectSavePath(): Promise<string | null> {
        return await window.electronAPI.pickProjectSavePath();
    }

    async materializeCacheImages(
        projectFilePath: string,
        cacheImagePaths: string[]
    ): Promise<Record<string, string>> {
        return await window.electronAPI.materializeCacheImages(
            projectFilePath,
            cacheImagePaths
        );
    }

    async saveProject(
        filePath: string,
        project: ProjectFile<ImageSet>,
        cacheImagePathsToDelete?: string[]
    ): Promise<boolean> {
        return await window.electronAPI.saveProject(
            filePath,
            project,
            cacheImagePathsToDelete
        );
    }

    async loadProject(): Promise<{
        project: ProjectFile<ImageSet>;
        filePath: string;
    } | null> {
        return await window.electronAPI.loadProject();
    }

    async loadProjectFromPath(
        filePath: string
    ): Promise<{ project: ProjectFile<ImageSet>; filePath: string } | null> {
        return await window.electronAPI.loadProjectFromPath(filePath);
    }

    async loadImage(): Promise<string | null> {
        return await window.electronAPI.loadImage();
    }

    async getImageInfo(imagePath: string): Promise<ImageInfoResult> {
        return await window.electronAPI.getImageInfo(imagePath);
    }

    async pasteImage(): Promise<string | null> {
        return await window.electronAPI.pasteImage();
    }

    async saveCacheImageAs(cacheFilePath: string): Promise<string | null> {
        return await window.electronAPI.saveCacheImageAs(cacheFilePath);
    }

    getPathForFile(file: File): string {
        return window.electronAPI.getPathForFile(file);
    }

    async toggleImageSettingsWindow(): Promise<boolean> {
        return await window.electronAPI.toggleImageSettingsWindow();
    }

    async toggleDimensionSettingsWindow(): Promise<boolean> {
        return await window.electronAPI.toggleDimensionSettingsWindow();
    }

    async updateImageSets(imageSets: ImageSet[]): Promise<void> {
        await window.electronAPI.updateImageSets(imageSets);
    }

    onImageSetsUpdated(callback: (imageSets: ImageSet[]) => void): () => void {
        return window.electronAPI.onImageSetsUpdated(callback);
    }

    async updateDimensionLines(dimensionLines: DimensionLine[]): Promise<void> {
        await window.electronAPI.updateDimensionLines(dimensionLines);
    }

    onDimensionLinesUpdated(
        callback: (dimensionLines: DimensionLine[]) => void
    ): () => void {
        return window.electronAPI.onDimensionLinesUpdated(callback);
    }

    async updateUnitFactor(factor: number): Promise<void> {
        await window.electronAPI.updateUnitFactor(factor);
    }

    onUnitFactorUpdated(callback: (factor: number) => void): () => void {
        return window.electronAPI.onUnitFactorUpdated(callback);
    }

    async updateUnit(unit: Unit): Promise<void> {
        await window.electronAPI.updateUnit(unit);
    }

    onUnitUpdated(callback: (unit: Unit) => void): () => void {
        return window.electronAPI.onUnitUpdated(callback);
    }

    async updateInteractionMode(mode: InteractionMode): Promise<void> {
        await window.electronAPI.updateInteractionMode(mode);
    }

    onInteractionModeUpdated(
        callback: (mode: InteractionMode) => void
    ): () => void {
        return window.electronAPI.onInteractionModeUpdated(callback);
    }

    async requestInitialState(): Promise<void> {
        await window.electronAPI.requestInitialState();
    }

    onRequestStateSync(callback: () => void): () => void {
        return window.electronAPI.onRequestStateSync(callback);
    }

    onClickThroughShortcutTriggered(callback: () => void): () => void {
        return window.electronAPI.onClickThroughShortcutTriggered(callback);
    }

    onFileOpen(callback: (filePath: string, ext: string) => void): () => void {
        return window.electronAPI.onFileOpen(callback);
    }

    async getLicenseInfo(): Promise<LicenseInfo[]> {
        return await window.electronAPI.getLicenseInfo();
    }

    async getAppVersion(): Promise<string> {
        return await window.electronAPI.getAppVersion();
    }

    async captureScreen(): Promise<CaptureResult> {
        return await window.electronAPI.captureScreen();
    }

    async captureWindow(): Promise<CaptureResult> {
        return await window.electronAPI.captureWindow();
    }

    async saveImage(dataUrl: string): Promise<string | null> {
        return await window.electronAPI.saveImage(dataUrl);
    }

    async updateSelectedImageId(id: string | null): Promise<void> {
        await window.electronAPI.updateSelectedImageId(id);
    }

    onSelectedImageIdUpdated(
        callback: (id: string | null) => void
    ): () => void {
        return window.electronAPI.onSelectedImageIdUpdated(callback);
    }

    async updateSelectedDimensionLineId(id: string | null): Promise<void> {
        await window.electronAPI.updateSelectedDimensionLineId(id);
    }

    onSelectedDimensionLineIdUpdated(
        callback: (id: string | null) => void
    ): () => void {
        return window.electronAPI.onSelectedDimensionLineIdUpdated(callback);
    }

    async updateProjectDirty(isDirty: boolean): Promise<void> {
        await window.electronAPI.updateProjectDirty(isDirty);
    }

    async getE2EStatus(): Promise<E2EControlStatus> {
        return await window.electronAPI.getE2EStatus();
    }

    async e2eSetScene(scene: E2ESceneInput): Promise<E2EResolvedScene> {
        return await window.electronAPI.e2eSetScene(scene);
    }

    async e2eLoadFixtureImage(
        request: E2ELoadFixtureImageRequest
    ): Promise<E2EResolvedFixtureImage> {
        return await window.electronAPI.e2eLoadFixtureImage(request);
    }

    async e2eWaitStable(
        request?: E2EWaitStableRequest
    ): Promise<E2EWaitStableResult> {
        return await window.electronAPI.e2eWaitStable(request);
    }

    async e2eCapture(
        request?: E2ECaptureRequest
    ): Promise<CaptureResult | null> {
        return await window.electronAPI.e2eCapture(request);
    }
}

// デフォルトのサービスインスタンス
let ipcServiceInstance: IIPCService = new IPCService();

/**
 * 現在のIPCサービスインスタンスを取得
 */
export const getIPCService = (): IIPCService => ipcServiceInstance;

/**
 * IPCサービスインスタンスを設定（テスト用）
 */
export const setIPCService = (service: IIPCService): void => {
    ipcServiceInstance = service;
};

/**
 * IPCサービスをデフォルトにリセット
 */
export const resetIPCService = (): void => {
    ipcServiceInstance = new IPCService();
};
