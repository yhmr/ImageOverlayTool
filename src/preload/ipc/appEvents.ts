import { appEventContracts } from "../../shared/ipc/contracts";
import { onIpcEventContract } from "./client";

/**
 * アプリケーション全体に関するイベント通信(ファイルドロップ等)のAPI構築関数
 */
export const createAppEventsApi = () => ({
    onFileOpen: (callback: (filePath: string, ext: string) => void) =>
        onIpcEventContract(appEventContracts.fileOpen, ({ filePath, ext }) =>
            callback(filePath, ext)
        ),
});
