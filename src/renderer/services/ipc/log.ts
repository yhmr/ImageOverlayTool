import { getElectronApi } from "./electronApi";
import type { IElectronAPI } from "../../../shared/ipc/electronApi";

/**
 * レンダラープロセス内でロギング通信を担うサービスのインターフェース
 */
type LogIPCService = Pick<IElectronAPI, "log">;

/**
 * ロギングIPC通信サービスを生成して返します。
 */
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
