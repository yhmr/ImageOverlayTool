import { IIPCService } from "@/renderer/services/ipcService";
import { ImageSet } from "@/shared/types/ImageSet";
import { ProjectFile } from "@/shared/types/ProjectFile";
import { CaptureResult } from "@/shared/types/CaptureResult";
import { SettingType } from "@/shared/types/AppConfig";

/**
 * テスト用モックサービス
 */
export class MockIPCService implements IIPCService {
    log = {
        debug: async () => { },
        info: async () => { },
        warn: async () => { },
        error: async () => { },
    };

    async switchWindowSize(): Promise<boolean> {
        return true;
    }
    async setWindowRect(): Promise<void> { }
    async closeWindow(): Promise<void> { }
    async loadSetting(): Promise<{ language: string }> {
        return { language: "en" };
    }
    async saveSetting(): Promise<void> { }
    async loadWindowColor(): Promise<string> {
        return "#ffffff";
    }
    async saveWindowColor(): Promise<void> { }
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
    async toggleImageSettingsWindow(): Promise<void> { }

    public updateImageSetsCalls: ImageSet[][] = [];
    public updateUnitFactorCalls: number[] = [];
    public updateUnitCalls: ("nm" | "um" | "mm")[] = [];

    async updateImageSets(imageSets: ImageSet[]): Promise<void> {
        this.updateImageSetsCalls.push(imageSets);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onImageSetsUpdated(callback: (imageSets: ImageSet[]) => void): () => void {
        return () => { };
    }

    async updateUnitFactor(factor: number): Promise<void> {
        this.updateUnitFactorCalls.push(factor);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onUnitFactorUpdated(callback: (factor: number) => void): () => void {
        return () => { };
    }

    async updateUnit(unit: "nm" | "um" | "mm"): Promise<void> {
        this.updateUnitCalls.push(unit);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onUnitUpdated(callback: (unit: "nm" | "um" | "mm") => void): () => void {
        return () => { };
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
        return () => { };
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onFileOpen(callback: (filePath: string, ext: string) => void): () => void {
        return () => { };
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

    async captureWindow(): Promise<CaptureResult> {
        return {
            filePath: "path/to/capture_window.png",
            width: 800,
            height: 600,
        };
    }

    async saveImage(): Promise<string | null> {
        return "path/to/image.png";
    }

    reset(): void {
        this.updateImageSetsCalls = [];
        this.updateUnitFactorCalls = [];
    }
}
