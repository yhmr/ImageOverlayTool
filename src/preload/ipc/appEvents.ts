import { IPC_EVENTS } from "../../shared/ipc/channels";
import { onIpcEvent } from "./client";

export const createAppEventsApi = () => ({
    onFileOpen: (callback: (filePath: string, ext: string) => void) =>
        onIpcEvent<[payload: { filePath: string; ext: string }]>(
            IPC_EVENTS.fileOpen,
            ({ filePath, ext }) => callback(filePath, ext)
        ),
});
