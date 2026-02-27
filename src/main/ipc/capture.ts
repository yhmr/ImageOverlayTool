import { ipcMain, IpcMainInvokeEvent } from "electron";
import {
    captureWindowAreaAndSave,
    saveDataUrlImage,
    type CaptureTestModeOptions,
} from "../services/captureService";
import { captureIpcContracts } from "../../shared/ipc/contracts";

/** キャプチャ関連ハンドラーの登録時オプション */
export interface CaptureHandlerOptions {
    /** E2Eテスト用のキャプチャモック設定 */
    testMode?: CaptureTestModeOptions;
}

/**
 * 画面全体やウィンドウ範囲のキャプチャ取得、および
 * 取得した画像データ(DataURL)の保存処理を担うIPCハンドラーを登録します。
 *
 * @param options E2Eテストに応じたモック動作などの設定オプション
 */
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
