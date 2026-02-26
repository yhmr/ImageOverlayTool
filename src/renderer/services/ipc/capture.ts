import { getElectronApi } from "./electronApi";
import type { IElectronAPI } from "../../../shared/ipc/electronApi";

/**
 * レンダラープロセス内で画面キャプチャ通信を担うサービスのインターフェース
 */
type CaptureIPCService = Pick<
    IElectronAPI,
    "captureScreen" | "captureWindow" | "saveImage"
>;

/**
 * キャプチャIPC通信サービスを生成して返します。
 */
export const createCaptureIPCService = (): CaptureIPCService => ({
    captureScreen: () => getElectronApi().captureScreen(),
    captureWindow: () => getElectronApi().captureWindow(),
    saveImage: (dataUrl: string) => getElectronApi().saveImage(dataUrl),
});
