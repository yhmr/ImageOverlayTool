import { getElectronApi } from "./electronApi";
import type { ICaptureIPCService } from "./types";

export const createCaptureIPCService = (): ICaptureIPCService => ({
    captureScreen: () => getElectronApi().captureScreen(),
    captureWindow: () => getElectronApi().captureWindow(),
    saveImage: (dataUrl: string) => getElectronApi().saveImage(dataUrl),
});
