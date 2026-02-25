import { getElectronApi } from "./electronApi";
import type { ILogIPCService } from "./types";

export const createLogIPCService = (): ILogIPCService => ({
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
