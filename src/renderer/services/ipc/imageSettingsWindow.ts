import { getElectronApi } from "./electronApi";
import type { IImageSettingsWindowIPCService } from "./types";

export const createImageSettingsWindowIPCService =
    (): IImageSettingsWindowIPCService => ({
        loadImage: () => getElectronApi().loadImage(),
        getImageInfo: (imagePath: string) =>
            getElectronApi().getImageInfo(imagePath),
        pasteImage: () => getElectronApi().pasteImage(),
        saveCacheImageAs: (cacheFilePath: string) =>
            getElectronApi().saveCacheImageAs(cacheFilePath),
        getPathForFile: (file: File) => getElectronApi().getPathForFile(file),
        toggleImageSettingsWindow: () =>
            getElectronApi().toggleImageSettingsWindow(),
        toggleDimensionSettingsWindow: () =>
            getElectronApi().toggleDimensionSettingsWindow(),
    });
