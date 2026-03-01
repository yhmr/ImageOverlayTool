import type { IElectronAPI } from "../shared/ipc/electronApi";

export type { IElectronAPI };

declare global {
    interface Window {
        electronAPI: IElectronAPI;
    }
}

declare module "*.png" {
    const value: string;
    export default value;
}
