import { IPC_CHANNELS } from "../../shared/ipc/channels";
import { invokeIpc } from "./client";

type WindowRect = {
    x: number;
    y: number;
    width: number;
    height: number;
};

export const createWindowApi = () => ({
    minimizeWindow: () => invokeIpc(IPC_CHANNELS.window.minimize),
    switchWindowSize: (): Promise<boolean> =>
        invokeIpc(IPC_CHANNELS.window.switchSize),
    setWindowRect: (rect: WindowRect) =>
        invokeIpc(IPC_CHANNELS.window.setRect, rect),
    setIgnoreMouseEvents: (ignore: boolean) =>
        invokeIpc(IPC_CHANNELS.window.setIgnoreMouseEvents, ignore),
    setAlwaysOnTop: (enabled: boolean) =>
        invokeIpc(IPC_CHANNELS.window.setAlwaysOnTop, enabled),
    closeWindow: () => invokeIpc(IPC_CHANNELS.window.close),
});
