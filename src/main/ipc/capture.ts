import { ipcMain, IpcMainInvokeEvent } from "electron";
import {
    captureWindowAreaAndSave,
    saveDataUrlImage,
    type CaptureTestModeOptions,
} from "../services/captureService";
import { captureIpcContracts } from "../../shared/ipc/contracts";

export interface CaptureHandlerOptions {
    testMode?: CaptureTestModeOptions;
}

export const registerCaptureHandlers = (
    options?: CaptureHandlerOptions
): void => {
    const testMode = options?.testMode;

    ipcMain.handle(
        captureIpcContracts.screen.channel,
        async (event: IpcMainInvokeEvent) => {
            return captureWindowAreaAndSave(event, true, testMode);
        }
    );

    ipcMain.handle(
        captureIpcContracts.window.channel,
        async (event: IpcMainInvokeEvent) => {
            return captureWindowAreaAndSave(event, false, testMode);
        }
    );

    ipcMain.handle(
        captureIpcContracts.saveImageData.channel,
        async (event: IpcMainInvokeEvent, dataUrl: string) => {
            return saveDataUrlImage(event, dataUrl, testMode);
        }
    );
};
