import { getElectronApi } from "./electronApi";
import type { IElectronAPI } from "../../../shared/ipc/electronApi";

type WindowRect = {
    x: number;
    y: number;
    width: number;
    height: number;
};

type WindowIPCService = Pick<
    IElectronAPI,
    | "minimizeWindow"
    | "switchWindowSize"
    | "setWindowRect"
    | "setIgnoreMouseEvents"
    | "setAlwaysOnTop"
    | "closeWindow"
>;

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
