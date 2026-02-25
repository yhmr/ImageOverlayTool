import { getElectronApi } from "./electronApi";
import type { IElectronAPI } from "../../../shared/ipc/electronApi";

type CaptureIPCService = Pick<
    IElectronAPI,
    "captureScreen" | "captureWindow" | "saveImage"
>;

export const createCaptureIPCService = (): CaptureIPCService => ({
    captureScreen: () => getElectronApi().captureScreen(),
    captureWindow: () => getElectronApi().captureWindow(),
    saveImage: (dataUrl: string) => getElectronApi().saveImage(dataUrl),
});
