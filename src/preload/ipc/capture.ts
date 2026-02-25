import { captureIpcContracts } from "../../shared/ipc/contracts";
import { invokeIpcContract } from "./client";

export const createCaptureApi = () => ({
    captureScreen: () => invokeIpcContract(captureIpcContracts.screen),
    captureWindow: () => invokeIpcContract(captureIpcContracts.window),
    saveImage: (dataUrl: string) =>
        invokeIpcContract(captureIpcContracts.saveImageData, dataUrl),
});
