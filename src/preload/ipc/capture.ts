import { IPC_CHANNELS } from "../../shared/ipc/channels";
import { invokeIpc } from "./client";

export const createCaptureApi = () => ({
    captureScreen: () => invokeIpc(IPC_CHANNELS.capture.screen),
    captureWindow: () => invokeIpc(IPC_CHANNELS.capture.window),
    saveImage: (dataUrl: string) =>
        invokeIpc(IPC_CHANNELS.capture.saveImageData, dataUrl),
});
