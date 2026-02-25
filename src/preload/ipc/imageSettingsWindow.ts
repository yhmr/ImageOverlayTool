import { webUtils } from "electron";
import {
    dimensionSettingsWindowIpcContracts,
    imageSettingsWindowIpcContracts,
} from "../../shared/ipc/contracts";
import type { ImageInfoResult } from "../../shared/types/ImageInfo";
import { invokeIpcContract } from "./client";

export const createImageSettingsWindowApi = () => ({
    loadImage: () =>
        invokeIpcContract(imageSettingsWindowIpcContracts.loadImage),
    getImageInfo: (imagePath: string): Promise<ImageInfoResult> =>
        invokeIpcContract(
            imageSettingsWindowIpcContracts.getImageInfo,
            imagePath
        ),
    pasteImage: (): Promise<string | null> =>
        invokeIpcContract(imageSettingsWindowIpcContracts.pasteImage),
    saveCacheImageAs: (cacheFilePath: string): Promise<string | null> =>
        invokeIpcContract(
            imageSettingsWindowIpcContracts.saveCacheImageAs,
            cacheFilePath
        ),
    getPathForFile: (file: File) => webUtils.getPathForFile(file),
    toggleImageSettingsWindow: () =>
        invokeIpcContract(imageSettingsWindowIpcContracts.toggle),
    toggleDimensionSettingsWindow: () =>
        invokeIpcContract(dimensionSettingsWindowIpcContracts.toggle),
});
