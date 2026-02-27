import { ipcMain, IpcMainInvokeEvent } from "electron";
import {
    captureWindowAreaAndSave,
    saveDataUrlImage,
} from "../services/captureService";
import { captureIpcContracts } from "../../shared/ipc/contracts";

/**
 * 画面全体やウィンドウ範囲のキャプチャ取得、および
 * 取得した画像データ(DataURL)の保存処理を担うIPCハンドラーを登録します。
 *
 */
export const registerCaptureHandlers = (): void => {
    ipcMain.handle(
        captureIpcContracts.screen.channel,
        async (event: IpcMainInvokeEvent) => {
            return captureWindowAreaAndSave(event, true);
        }
    );

    ipcMain.handle(
        captureIpcContracts.window.channel,
        async (event: IpcMainInvokeEvent) => {
            return captureWindowAreaAndSave(event, false);
        }
    );

    ipcMain.handle(
        captureIpcContracts.saveImageData.channel,
        async (event: IpcMainInvokeEvent, dataUrl: string) => {
            return saveDataUrlImage(event, dataUrl);
        }
    );
};
