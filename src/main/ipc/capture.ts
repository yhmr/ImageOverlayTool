import { ipcMain, IpcMainInvokeEvent } from "electron";
import {
    captureWindowAreaAndSave,
    saveDataUrlImage,
    type CaptureTestModeOptions,
} from "../services/captureService";

export interface CaptureHandlerOptions {
    testMode?: CaptureTestModeOptions;
}

export const registerCaptureHandlers = (
    options?: CaptureHandlerOptions
): void => {
    const testMode = options?.testMode;

    ipcMain.handle("capture-screen", async (event: IpcMainInvokeEvent) => {
        return captureWindowAreaAndSave(event, true, testMode);
    });

    ipcMain.handle("capture-window", async (event: IpcMainInvokeEvent) => {
        return captureWindowAreaAndSave(event, false, testMode);
    });

    ipcMain.handle(
        "save-image-data",
        async (event: IpcMainInvokeEvent, dataUrl: string) => {
            return saveDataUrlImage(event, dataUrl, testMode);
        }
    );
};
