import type { CaptureResult } from "../../types/CaptureResult";
import { defineInvokeContract, type InvokeContract } from "../contract";
import { IPC_CHANNELS } from "../channels";

export type CaptureInvokeContracts = {
    screen: InvokeContract<[], CaptureResult>;
    window: InvokeContract<[], CaptureResult>;
    saveImageData: InvokeContract<[dataUrl: string], string | null>;
};

export const captureIpcContracts: CaptureInvokeContracts = {
    screen: defineInvokeContract(IPC_CHANNELS.capture.screen),
    window: defineInvokeContract(IPC_CHANNELS.capture.window),
    saveImageData: defineInvokeContract(IPC_CHANNELS.capture.saveImageData),
};
