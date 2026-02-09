/**
 * IPC通信を抽象化するサービスレイヤー
 * window.electronAPIへのアクセスをラップし、テスト時のモック化を容易にする
 */

import type { ImageSet } from "../../shared/types/ImageSet";
import type { ProjectFile } from "../../shared/types/ProjectFile";
import type { SettingType } from "../../shared/types/AppConfig";
import type { CaptureResult } from "../../shared/types/CaptureResult";

/**
 * IPCサービスのインターフェース
 */
export interface IIPCService {
    // Logger
    log: {
        debug: (message: string, ...params: unknown[]) => Promise<void>;
        info: (message: string, ...params: unknown[]) => Promise<void>;
        warn: (message: string, ...params: unknown[]) => Promise<void>;
        error: (message: string, ...params: unknown[]) => Promise<void>;
    };

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
    loadSetting: () => Promise<{ language: string }>;
    saveSetting: (setting: SettingType) => Promise<void>;

    // Window Color
    loadWindowColor: () => Promise<string>;
    saveWindowColor: (color: string) => Promise<void>;

    // Project
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

    // Image Settings Window
    loadImage: () => Promise<string | null>;
    toggleImageSettingsWindow: () => Promise<boolean>;

    // ImageSets Sync
    updateImageSets(imageSets: ImageSet[]): Promise<void>;
    onImageSetsUpdated: (
        callback: (imageSets: ImageSet[]) => void
    ) => () => void;

    // Unit Factor Sync
    updateUnitFactor(factor: number): Promise<void>;
    onUnitFactorUpdated: (callback: (factor: number) => void) => () => void;

    // Unit sync
    updateUnit(unit: "nm" | "um" | "mm"): Promise<void>;
    onUnitUpdated: (callback: (unit: "nm" | "um" | "mm") => void) => () => void;

    // Initial State Sync
    requestInitialState: () => Promise<void>;
    onRequestStateSync: (callback: () => void) => () => void;

    // File Open
    onFileOpen: (
        callback: (filePath: string, ext: string) => void
    ) => () => void;

    // License
    getLicenseInfo: () => Promise<unknown>;

    // App Version
    getAppVersion: () => Promise<string>;

    // Capture
    captureScreen: () => Promise<CaptureResult>;
    captureWindow: () => Promise<CaptureResult>;
    saveImage: (dataUrl: string) => Promise<string | null>;
}

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

    async updateUnit(unit: "nm" | "um" | "mm"): Promise<void> {
        await window.electronAPI.updateUnit(unit);
    }

    onUnitUpdated(callback: (unit: "nm" | "um" | "mm") => void): () => void {
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

    async getLicenseInfo(): Promise<unknown> {
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
