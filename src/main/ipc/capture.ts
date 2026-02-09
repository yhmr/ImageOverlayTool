import { ipcMain, IpcMainInvokeEvent } from "electron";
import {
    captureWindowAreaAndSave,
    saveDataUrlImage,
    type CaptureTestModeOptions,
} from "../services/captureService";
import { IPC_CHANNELS } from "../../shared/ipc/channels";

export interface CaptureHandlerOptions {
    testMode?: CaptureTestModeOptions;
}

export const registerCaptureHandlers = (
    options?: CaptureHandlerOptions
): void => {
    const testMode = options?.testMode;

    ipcMain.handle(
        IPC_CHANNELS.capture.screen,
        async (event: IpcMainInvokeEvent) => {
            return captureWindowAreaAndSave(event, true, testMode);
        }
    );

    ipcMain.handle(
        IPC_CHANNELS.capture.window,
        async (event: IpcMainInvokeEvent) => {
            return captureWindowAreaAndSave(event, false, testMode);
        }
    );

    ipcMain.handle(
        IPC_CHANNELS.capture.saveImageData,
        async (event: IpcMainInvokeEvent, dataUrl: string) => {
            return saveDataUrlImage(event, dataUrl, testMode);
        }
    );
};
