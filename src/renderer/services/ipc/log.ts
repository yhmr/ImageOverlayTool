import { getElectronApi } from "./electronApi";
import type { IElectronAPI } from "../../../shared/ipc/electronApi";

type LogIPCService = Pick<IElectronAPI, "log">;

export const createLogIPCService = (): LogIPCService => ({
    log: {
        debug: (message: string, ...params: unknown[]) =>
            getElectronApi().log.debug(message, ...params),
        info: (message: string, ...params: unknown[]) =>
            getElectronApi().log.info(message, ...params),
        warn: (message: string, ...params: unknown[]) =>
            getElectronApi().log.warn(message, ...params),
        error: (message: string, ...params: unknown[]) =>
            getElectronApi().log.error(message, ...params),
        export: () => getElectronApi().log.export(),
    },
});
