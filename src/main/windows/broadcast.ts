import type { IWindowCollectionProvider } from "./windowManager";

export const broadcastToOtherWindows = (
    windowProvider: IWindowCollectionProvider,
    senderWebContentsId: number,
    event: string,
    ...payload: unknown[]
): void => {
    const windows = windowProvider.getAllWindows();
    windows.forEach((win) => {
        if (win.webContents.id !== senderWebContentsId) {
            win.webContents.send(event, ...payload);
        }
    });
};
