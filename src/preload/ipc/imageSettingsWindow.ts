import { webUtils } from "electron";
import { IPC_CHANNELS } from "../../shared/ipc/channels";
import type { ImageInfoResult } from "../../shared/types/ImageInfo";
import { invokeIpc } from "./client";

export const createImageSettingsWindowApi = () => ({
    loadImage: () =>
        invokeIpc<string | null>(IPC_CHANNELS.imageSettingsWindow.loadImage),
    getImageInfo: (imagePath: string): Promise<ImageInfoResult> =>
        invokeIpc(IPC_CHANNELS.imageSettingsWindow.getImageInfo, imagePath),
    pasteImage: (): Promise<string | null> =>
        invokeIpc(IPC_CHANNELS.imageSettingsWindow.pasteImage),
    saveCacheImageAs: (cacheFilePath: string): Promise<string | null> =>
        invokeIpc(
            IPC_CHANNELS.imageSettingsWindow.saveCacheImageAs,
            cacheFilePath
        ),
    getPathForFile: (file: File) => webUtils.getPathForFile(file),
    toggleImageSettingsWindow: () =>
        invokeIpc<boolean>(IPC_CHANNELS.imageSettingsWindow.toggle),
    toggleDimensionSettingsWindow: () =>
        invokeIpc<boolean>(IPC_CHANNELS.dimensionSettingsWindow.toggle),
});
