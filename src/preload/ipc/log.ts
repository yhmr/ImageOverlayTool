import { logIpcContracts } from "../../shared/ipc/contracts";
import type { LogLevel } from "../../shared/ipc/contracts/log";
import { invokeIpcContract } from "./client";

/**
 * ロギングに関するIPC通信APIの構築関数
 */
export const createLogApi = () => ({
    log: {
        write: (level: LogLevel, message: string, params: unknown[]) =>
            invokeIpcContract(logIpcContracts.write, level, message, params),
        export: () => invokeIpcContract(logIpcContracts.export),
    },
});
