import type { ImageInfoResult } from "../../types/ImageInfo";
import { defineInvokeContract, type InvokeContract } from "../contract";
import { IPC_CHANNELS } from "../channels";

/**
 * 画像設定ウィンドウ管理関連のIPC通信におけるRequest/Responseの型定義群
 */
export type ImageSettingsWindowInvokeContracts = {
    toggle: InvokeContract<[], boolean>;
    loadImage: InvokeContract<[], string | null>;
    getImageInfo: InvokeContract<[imagePath: string], ImageInfoResult>;
    pasteImage: InvokeContract<[], string | null>;
    saveCacheImageAs: InvokeContract<[cacheFilePath: string], string | null>;
};

/**
 * 寸法設定ウィンドウ管理関連のIPC通信におけるRequest/Responseの型定義群
 */
export type DimensionSettingsWindowInvokeContracts = {
    toggle: InvokeContract<[], boolean>;
};

/** 画像設定ウィンドウ管理関連IPC通信の契約定義オブジェクト */
export const imageSettingsWindowIpcContracts: ImageSettingsWindowInvokeContracts =
    {
        toggle: defineInvokeContract(IPC_CHANNELS.imageSettingsWindow.toggle),
        loadImage: defineInvokeContract(
            IPC_CHANNELS.imageSettingsWindow.loadImage
        ),
        getImageInfo: defineInvokeContract(
            IPC_CHANNELS.imageSettingsWindow.getImageInfo
        ),
        pasteImage: defineInvokeContract(
            IPC_CHANNELS.imageSettingsWindow.pasteImage
        ),
        saveCacheImageAs: defineInvokeContract(
            IPC_CHANNELS.imageSettingsWindow.saveCacheImageAs
        ),
    };

/** 寸法設定ウィンドウ管理関連IPC通信の契約定義オブジェクト */
export const dimensionSettingsWindowIpcContracts: DimensionSettingsWindowInvokeContracts =
    {
        toggle: defineInvokeContract(
            IPC_CHANNELS.dimensionSettingsWindow.toggle
        ),
    };
