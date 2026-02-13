import { IIPCService } from "@/renderer/services/ipcService";
import { ImageSet } from "@/shared/types/ImageSet";
import { ProjectFile } from "@/shared/types/ProjectFile";
import { CaptureResult } from "@/shared/types/CaptureResult";
import { SettingType } from "@/shared/types/AppConfig";
import { LicenseInfo } from "@/shared/types/LicenseInfo";

/**
 * テスト用モックサービス
 */
export class MockIPCService implements IIPCService {
    log = {
        debug: async () => { },
        info: async () => { },
        warn: async () => { },
        error: async () => { },
        export: async () => null,
    };

    async switchWindowSize(): Promise<boolean> {
        return true;
    }

    async setWindowRect(_rect: {
        x: number;
        y: number;
        width: number;
        height: number;
    }): Promise<void> { }

    async closeWindow(): Promise<void> { }

    async loadSetting(): Promise<SettingType> {
        return { language: "en", logLevel: "info" };
    }

    async saveSetting(_setting: SettingType): Promise<void> { }

    async exportSettings(): Promise<string | null> {
        return "path/to/settings.json";
    }

    async importSettings(): Promise<SettingType | null> {
        return { language: "en", logLevel: "info" };
    }

    async loadWindowColor(): Promise<string> {
        return "#ffffff";
    }

    async saveWindowColor(_color: string): Promise<void> { }

    async saveProjectAs(_project: ProjectFile<ImageSet>): Promise<string | null> {
        return "path/to/project.iot";
    }

    async saveProject(
        _filePath: string,
        _project: ProjectFile
    ): Promise<boolean> {
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

    async toggleImageSettingsWindow(): Promise<boolean> {
        return true;
    }

    public updateImageSetsCalls: ImageSet[][] = [];
    public updateUnitFactorCalls: number[] = [];
    public updateUnitCalls: ("nm" | "um" | "mm")[] = [];

    async updateImageSets(imageSets: ImageSet[]): Promise<void> {
        this.updateImageSetsCalls.push(imageSets);
    }

    onImageSetsUpdated(_callback: (imageSets: ImageSet[]) => void): () => void {
        return () => { };
    }

    async updateUnitFactor(factor: number): Promise<void> {
        this.updateUnitFactorCalls.push(factor);
    }

    onUnitFactorUpdated(_callback: (factor: number) => void): () => void {
        return () => { };
    }

    async updateUnit(unit: "nm" | "um" | "mm"): Promise<void> {
        this.updateUnitCalls.push(unit);
    }

    onUnitUpdated(_callback: (unit: "nm" | "um" | "mm") => void): () => void {
        return () => { };
    }

    async requestInitialState(): Promise<void> { }

    onRequestStateSync(_callback: () => void): () => void {
        return () => { };
    }

    onFileOpen(_callback: (filePath: string, ext: string) => void): () => void {
        return () => { };
    }

    async getLicenseInfo(): Promise<LicenseInfo[]> {
        return [];
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

    async captureWindow(): Promise<CaptureResult> {
        return {
            filePath: "path/to/capture_window.png",
            width: 800,
            height: 600,
        };
    }

    async saveImage(_dataUrl: string): Promise<string | null> {
        return "path/to/image.png";
    }

    async updateSelectedImageId(_id: string | null): Promise<void> { }

    onSelectedImageIdUpdated(
        _callback: (id: string | null) => void
    ): () => void {
        return () => { };
    }

    async updateProjectDirty(_isDirty: boolean): Promise<void> { }

    reset(): void {
        this.updateImageSetsCalls = [];
        this.updateUnitFactorCalls = [];
    }
}
