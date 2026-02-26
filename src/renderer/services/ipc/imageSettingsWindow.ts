import { getElectronApi } from "./electronApi";
import type { IElectronAPI } from "../../../shared/ipc/electronApi";

/**
 * レンダラープロセス内で画像設定・寸法設定ウィンドウ制御通信を担うサービスのインターフェース
 */
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

/**
 * 画像設定・寸法設定ウィンドウ管理IPC通信サービスを生成して返します。
 */
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
