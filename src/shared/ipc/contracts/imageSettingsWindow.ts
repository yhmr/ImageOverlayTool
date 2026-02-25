import type { ImageInfoResult } from "../../types/ImageInfo";
import { defineInvokeContract, type InvokeContract } from "../contract";
import { IPC_CHANNELS } from "../channels";

export type ImageSettingsWindowInvokeContracts = {
    toggle: InvokeContract<[], boolean>;
    loadImage: InvokeContract<[], string | null>;
    getImageInfo: InvokeContract<[imagePath: string], ImageInfoResult>;
    pasteImage: InvokeContract<[], string | null>;
    saveCacheImageAs: InvokeContract<[cacheFilePath: string], string | null>;
};

export type DimensionSettingsWindowInvokeContracts = {
    toggle: InvokeContract<[], boolean>;
};

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

export const dimensionSettingsWindowIpcContracts: DimensionSettingsWindowInvokeContracts =
    {
        toggle: defineInvokeContract(
            IPC_CHANNELS.dimensionSettingsWindow.toggle
        ),
    };
