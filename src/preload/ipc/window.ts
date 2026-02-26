import {
    windowIpcContracts,
    type WindowRect,
} from "../../shared/ipc/contracts/window";
import { invokeIpcContract } from "./client";

/**
 * 汎用的なウィンドウ操作に関するIPC通信APIの構築関数
 */
export const createWindowApi = () => ({
    minimizeWindow: () => invokeIpcContract(windowIpcContracts.minimize),
    switchWindowSize: (): Promise<boolean> =>
        invokeIpcContract(windowIpcContracts.switchSize),
    setWindowRect: (rect: WindowRect) =>
        invokeIpcContract(windowIpcContracts.setRect, rect),
    setIgnoreMouseEvents: (ignore: boolean) =>
        invokeIpcContract(windowIpcContracts.setIgnoreMouseEvents, ignore),
    setAlwaysOnTop: (enabled: boolean) =>
        invokeIpcContract(windowIpcContracts.setAlwaysOnTop, enabled),
    closeWindow: () => invokeIpcContract(windowIpcContracts.close),
});
