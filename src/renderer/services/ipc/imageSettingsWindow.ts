import { getElectronApi } from "./electronApi";
import type { IElectronAPI } from "../../../shared/ipc/electronApi";

type ImageSettingsWindowIPCService = Pick<
    IElectronAPI,
    | "loadImage"
    | "getImageInfo"
    | "pasteImage"
    | "saveCacheImageAs"
    | "getPathForFile"
    | "toggleImageSettingsWindow"
    | "toggleDimensionSettingsWindow"
>;

export const createImageSettingsWindowIPCService =
    (): ImageSettingsWindowIPCService => ({
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
