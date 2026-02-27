import { getElectronApi } from "./electronApi";
import type { IElectronAPI } from "../../../shared/ipc/electronApi";
import type { InvokeArgs } from "../../../shared/ipc/contract";
import { logIpcContracts } from "../../../shared/ipc/contracts";

type LogWriteArgs = InvokeArgs<typeof logIpcContracts.write>;
type LogLevel = LogWriteArgs[0];
type LogMessage = LogWriteArgs[1];
type LogParams = LogWriteArgs[2];

/**
 * レンダラープロセス内でロギング通信を担うサービスのインターフェース
 */
type LogIPCService = {
    log: {
        debug: (message: LogMessage, ...params: LogParams) => Promise<void>;
        info: (message: LogMessage, ...params: LogParams) => Promise<void>;
        warn: (message: LogMessage, ...params: LogParams) => Promise<void>;
        error: (message: LogMessage, ...params: LogParams) => Promise<void>;
        export: IElectronAPI["log"]["export"];
    };
};

const writeLog = (level: LogLevel, message: LogMessage, params: LogParams) =>
    getElectronApi().log.write(level, message, params);

/**
 * ロギングIPC通信サービスを生成して返します。
 */
export const createLogIPCService = (): LogIPCService => ({
    log: {
        debug: (message: string, ...params: unknown[]) =>
            writeLog("debug", message, params),
        info: (message: string, ...params: unknown[]) =>
            writeLog("info", message, params),
        warn: (message: string, ...params: unknown[]) =>
            writeLog("warn", message, params),
        error: (message: string, ...params: unknown[]) =>
            writeLog("error", message, params),
        export: () => getElectronApi().log.export(),
    },
});
