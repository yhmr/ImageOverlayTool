import { getElectronApi } from "./electronApi";
import type { IWindowIPCService } from "./types";

type WindowRect = {
    x: number;
    y: number;
    width: number;
    height: number;
};

export const createWindowIPCService = (): IWindowIPCService => ({
    minimizeWindow: () => getElectronApi().minimizeWindow(),
    switchWindowSize: () => getElectronApi().switchWindowSize(),
    setWindowRect: (rect: WindowRect) => getElectronApi().setWindowRect(rect),
    setIgnoreMouseEvents: (ignore: boolean) =>
        getElectronApi().setIgnoreMouseEvents(ignore),
    setAlwaysOnTop: (enabled: boolean) =>
        getElectronApi().setAlwaysOnTop(enabled),
    closeWindow: () => getElectronApi().closeWindow(),
});
