import { appEventContracts } from "../../shared/ipc/contracts";
import { onIpcEventContract } from "./client";

export const createAppEventsApi = () => ({
    onFileOpen: (callback: (filePath: string, ext: string) => void) =>
        onIpcEventContract(appEventContracts.fileOpen, ({ filePath, ext }) =>
            callback(filePath, ext)
        ),
});
