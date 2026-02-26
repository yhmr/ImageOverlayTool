import { getElectronApi } from "./electronApi";
import type { IElectronAPI } from "../../../shared/ipc/electronApi";

type WindowRect = {
    x: number;
    y: number;
    width: number;
    height: number;
};

/**
 * レンダラープロセス内で汎用ウィンドウ操作通信を担うサービスのインターフェース
 */
type WindowIPCService = Pick<
    IElectronAPI,
    | "minimizeWindow"
    | "switchWindowSize"
    | "setWindowRect"
    | "setIgnoreMouseEvents"
    | "setAlwaysOnTop"
    | "closeWindow"
>;

/**
 * ウィンドウ操作管理IPC通信サービスを生成して返します。
 */
export const createWindowIPCService = (): WindowIPCService => ({
    minimizeWindow: () => getElectronApi().minimizeWindow(),
    switchWindowSize: () => getElectronApi().switchWindowSize(),
    setWindowRect: (rect: WindowRect) => getElectronApi().setWindowRect(rect),
    setIgnoreMouseEvents: (ignore: boolean) =>
        getElectronApi().setIgnoreMouseEvents(ignore),
    setAlwaysOnTop: (enabled: boolean) =>
        getElectronApi().setAlwaysOnTop(enabled),
    closeWindow: () => getElectronApi().closeWindow(),
});
