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
    saveProjectAs: (project: ProjectFile) => Promise<string | null>;
    saveProject: (filePath: string, project: ProjectFile) => Promise<boolean>;
    loadProject: () => Promise<{
        project: ProjectFile<ImageSet>;
        filePath: string;
    } | null>;
    loadProjectFromPath: (
        filePath: string
    ) => Promise<{ project: ProjectFile<ImageSet>; filePath: string } | null>;

    // Image Settings Window
    loadImage: () => Promise<string | null>;
    toggleImageSettingsWindow: () => Promise<void>;

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
    requestInitialState: () => Promise<{
        imageSets: ImageSet[];
        unitFactor: number;
        unit: "nm" | "um" | "mm";
    }>;
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
        return (await window.electronAPI.loadSetting()) as { language: string };
    }

    async saveSetting(setting: SettingType): Promise<void> {
        await window.electronAPI.saveSetting(setting);
    }

    async loadWindowColor(): Promise<string> {
        return (await window.electronAPI.loadWindowColor()) as string;
    }

    async saveWindowColor(color: string): Promise<void> {
        await window.electronAPI.saveWindowColor(color);
    }

    async saveProjectAs(project: ProjectFile): Promise<string | null> {
        return (await window.electronAPI.saveProjectAs(project)) as
            | string
            | null;
    }

    async saveProject(
        filePath: string,
        project: ProjectFile
    ): Promise<boolean> {
        return (await window.electronAPI.saveProject(
            filePath,
            project
        )) as unknown as boolean;
    }

    async loadProject(): Promise<{
        project: ProjectFile<ImageSet>;
        filePath: string;
    } | null> {
        const res = (await window.electronAPI.loadProject()) as unknown as {
            project: ProjectFile<ImageSet>;
            filePath: string;
        } | null;
        return res;
    }

    async loadProjectFromPath(
        filePath: string
    ): Promise<{ project: ProjectFile<ImageSet>; filePath: string } | null> {
        const res = (await window.electronAPI.loadProjectFromPath(
            filePath
        )) as unknown as {
            project: ProjectFile<ImageSet>;
            filePath: string;
        } | null;
        return res;
    }

    async loadImage(): Promise<string | null> {
        return (await window.electronAPI.loadImage()) as string | null;
    }

    async toggleImageSettingsWindow(): Promise<void> {
        await window.electronAPI.toggleImageSettingsWindow();
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

    async requestInitialState(): Promise<{
        imageSets: ImageSet[];
        unitFactor: number;
        unit: "nm" | "um" | "mm";
    }> {
        const res = await window.electronAPI.requestInitialState();
        return res;
    }

    onRequestStateSync(callback: () => void): () => void {
        return window.electronAPI.onRequestStateSync(callback);
    }

    onFileOpen(callback: (filePath: string, ext: string) => void): () => void {
        return window.electronAPI.onFileOpen(callback);
    }

    async getLicenseInfo(): Promise<unknown> {
        return (await window.electronAPI.getLicenseInfo()) as unknown;
    }

    async getAppVersion(): Promise<string> {
        return (await window.electronAPI.getAppVersion()) as string;
    }

    async captureScreen(): Promise<CaptureResult> {
        return (await window.electronAPI.captureScreen()) as CaptureResult;
    }
}

/**
 * テスト用モックサービス
 */
export class MockIPCService implements IIPCService {
    log = {
        debug: async () => {},
        info: async () => {},
        warn: async () => {},
        error: async () => {},
    };

    async switchWindowSize(): Promise<boolean> {
        return true;
    }
    async setWindowRect(): Promise<void> {}
    async closeWindow(): Promise<void> {}
    async loadSetting(): Promise<{ language: string }> {
        return { language: "en" };
    }
    async saveSetting(): Promise<void> {}
    async loadWindowColor(): Promise<string> {
        return "#ffffff";
    }
    async saveWindowColor(): Promise<void> {}
    async saveProjectAs(): Promise<string | null> {
        return "path/to/project.iot";
    }
    async saveProject(): Promise<boolean> {
        return true;
    }
    async loadProject(): Promise<{
        project: ProjectFile<ImageSet>;
        filePath: string;
    } | null> {
        return null;
    }
    async loadProjectFromPath(): Promise<{
        project: ProjectFile<ImageSet>;
        filePath: string;
    } | null> {
        return null;
    }
    async loadImage(): Promise<string | null> {
        return "path/to/image.png";
    }
    async toggleImageSettingsWindow(): Promise<void> {}

    public updateImageSetsCalls: ImageSet[][] = [];
    public updateUnitFactorCalls: number[] = [];
    public updateUnitCalls: ("nm" | "um" | "mm")[] = [];

    async updateImageSets(imageSets: ImageSet[]): Promise<void> {
        this.updateImageSetsCalls.push(imageSets);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onImageSetsUpdated(callback: (imageSets: ImageSet[]) => void): () => void {
        return () => {};
    }

    async updateUnitFactor(factor: number): Promise<void> {
        this.updateUnitFactorCalls.push(factor);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onUnitFactorUpdated(callback: (factor: number) => void): () => void {
        return () => {};
    }

    async updateUnit(unit: "nm" | "um" | "mm"): Promise<void> {
        this.updateUnitCalls.push(unit);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onUnitUpdated(callback: (unit: "nm" | "um" | "mm") => void): () => void {
        return () => {};
    }

    async requestInitialState(): Promise<{
        imageSets: ImageSet[];
        unitFactor: number;
        unit: "nm" | "um" | "mm";
    }> {
        return { imageSets: [], unitFactor: 1.0, unit: "um" };
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onRequestStateSync(callback: () => void): () => void {
        return () => {};
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onFileOpen(callback: (filePath: string, ext: string) => void): () => void {
        return () => {};
    }

    async getLicenseInfo(): Promise<unknown> {
        return {};
    }
    async getAppVersion(): Promise<string> {
        return "1.0.0";
    }

    async captureScreen(): Promise<CaptureResult> {
        return {
            filePath: "path/to/capture.png",
            width: 800,
            height: 600,
        };
    }

    reset(): void {
        this.updateImageSetsCalls = [];
        this.updateUnitFactorCalls = [];
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
