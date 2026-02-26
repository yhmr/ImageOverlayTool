import type { BrowserWindow } from "electron";
import type { IWindowCollectionProvider } from "./windowManager";

const sendToWindows = (
    windows: BrowserWindow[],
    event: string,
    ...payload: unknown[]
): void => {
    windows.forEach((win) => {
        win.webContents.send(event, ...payload);
    });
};

export const broadcastToAllWindows = (
    windows: BrowserWindow[],
    event: string,
    ...payload: unknown[]
): void => {
    sendToWindows(windows, event, ...payload);
};

export const broadcastToOtherWindows = (
    windowProvider: IWindowCollectionProvider,
    senderWebContentsId: number,
    event: string,
    ...payload: unknown[]
): void => {
    const targetWindows = windowProvider
        .getAllWindows()
        .filter((win) => win.webContents.id !== senderWebContentsId);
    sendToWindows(targetWindows, event, ...payload);
};
