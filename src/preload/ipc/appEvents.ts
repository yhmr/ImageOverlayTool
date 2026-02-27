import { appEventContracts } from "../../shared/ipc/contracts";
import type { EventArgs } from "../../shared/ipc/contract";
import { onIpcEventContract } from "./client";

type FileOpenPayload = EventArgs<typeof appEventContracts.fileOpen>[0];
type LaunchIntentApplyPayload = EventArgs<
    typeof appEventContracts.launchIntentApply
>[0];
type AppControlCommandApplyPayload = EventArgs<
    typeof appEventContracts.appControlCommandApply
>[0];

/**
 * アプリケーション全体に関するイベント通信(ファイルドロップ等)のAPI構築関数
 */
export const createAppEventsApi = () => ({
    onFileOpen: (callback: (payload: FileOpenPayload) => void) =>
        onIpcEventContract(appEventContracts.fileOpen, callback),
    onLaunchIntentApply: (
        callback: (payload: LaunchIntentApplyPayload) => void
    ) => onIpcEventContract(appEventContracts.launchIntentApply, callback),
    onAppControlCommandApply: (
        callback: (payload: AppControlCommandApplyPayload) => void
    ) => onIpcEventContract(appEventContracts.appControlCommandApply, callback),
});
