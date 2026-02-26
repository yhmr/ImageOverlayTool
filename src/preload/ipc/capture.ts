import { captureIpcContracts } from "../../shared/ipc/contracts";
import { invokeIpcContract } from "./client";

/**
 * 画面キャプチャに関するIPC通信APIの構築関数
 */
export const createCaptureApi = () => ({
    captureScreen: () => invokeIpcContract(captureIpcContracts.screen),
    captureWindow: () => invokeIpcContract(captureIpcContracts.window),
    saveImage: (dataUrl: string) =>
        invokeIpcContract(captureIpcContracts.saveImageData, dataUrl),
});
