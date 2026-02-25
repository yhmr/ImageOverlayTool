import { ipcRenderer } from "electron";

export const invokeIpc = <TReturn = void>(
    channel: string,
    ...args: unknown[]
): Promise<TReturn> => ipcRenderer.invoke(channel, ...args) as Promise<TReturn>;

export const onIpcEvent = <TArgs extends unknown[]>(
    event: string,
    callback: (...args: TArgs) => void
): (() => void) => {
    const listener = (_event: unknown, ...args: TArgs) => callback(...args);
    ipcRenderer.on(event, listener);
    return () => ipcRenderer.removeListener(event, listener);
};
