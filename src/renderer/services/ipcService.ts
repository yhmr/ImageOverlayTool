/**
 * IPC通信を抽象化するサービスレイヤー
 * window.electronAPIへのアクセスをラップし、テスト時のモック化を容易にする
 */

import type { ImageSet } from "../../shared/types/ImageSet";
import type { ProjectFile } from "../../shared/types/ProjectFile";
import type { SettingType } from "../../shared/types/AppConfig";
import type { CaptureResult } from "../../shared/types/CaptureResult";
import type { LicenseInfo } from "../../shared/types/LicenseInfo";
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
    closeWindow: () => Promise<void>;
}

export interface ISettingsIPCService {
    loadSetting: () => Promise<{ language: string }>;
    saveSetting: (setting: SettingType) => Promise<void>;
    exportSettings: () => Promise<string | null>;
    importSettings: () => Promise<{ language: string } | null>;
    loadWindowColor: () => Promise<string>;
    saveWindowColor: (color: string) => Promise<void>;
}

export interface IProjectIPCService {
    saveProjectAs: (project: ProjectFile<ImageSet>) => Promise<string | null>;
    saveProject: (
        filePath: string,
        project: ProjectFile<ImageSet>
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
    toggleImageSettingsWindow: () => Promise<boolean>;
}

export interface IImageSyncIPCService {
    updateImageSets(imageSets: ImageSet[]): Promise<void>;
    onImageSetsUpdated: (
        callback: (imageSets: ImageSet[]) => void
    ) => () => void;
}

export interface IUnitSyncIPCService {
    updateUnitFactor(factor: number): Promise<void>;
    onUnitFactorUpdated: (callback: (factor: number) => void) => () => void;

    updateUnit(unit: Unit): Promise<void>;
    onUnitUpdated: (callback: (unit: Unit) => void) => () => void;
}

export interface IStateSyncIPCService {
    requestInitialState: () => Promise<void>;
    onRequestStateSync: (callback: () => void) => () => void;
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

export interface IProjectDataSyncIPCService {
    updateImageSets(imageSets: ImageSet[]): Promise<void>;
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
        IUnitSyncIPCService,
        IStateSyncIPCService,
        ILicenseIPCService,
        ICaptureIPCService,
        ISelectedImageSyncIPCService {}
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

    async closeWindow(): Promise<void> {
        await window.electronAPI.closeWindow();
    }

    async loadSetting(): Promise<{ language: string }> {
        return await window.electronAPI.loadSetting();
    }

    async saveSetting(setting: SettingType): Promise<void> {
        await window.electronAPI.saveSetting(setting);
    }

    async exportSettings(): Promise<string | null> {
        return await window.electronAPI.exportSettings();
    }

    async importSettings(): Promise<{ language: string } | null> {
        return await window.electronAPI.importSettings();
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

    async saveProject(
        filePath: string,
        project: ProjectFile<ImageSet>
    ): Promise<boolean> {
        return await window.electronAPI.saveProject(filePath, project);
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

    async toggleImageSettingsWindow(): Promise<boolean> {
        return await window.electronAPI.toggleImageSettingsWindow();
    }

    async updateImageSets(imageSets: ImageSet[]): Promise<void> {
        await window.electronAPI.updateImageSets(imageSets);
    }

    onImageSetsUpdated(callback: (imageSets: ImageSet[]) => void): () => void {
        return window.electronAPI.onImageSetsUpdated(callback);
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

    async requestInitialState(): Promise<void> {
        await window.electronAPI.requestInitialState();
    }

    onRequestStateSync(callback: () => void): () => void {
        return window.electronAPI.onRequestStateSync(callback);
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
