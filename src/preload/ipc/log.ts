import { logIpcContracts } from "../../shared/ipc/contracts";
import { invokeIpcContract } from "./client";

export const createLogApi = () => ({
    log: {
        debug: (message: string, ...params: unknown[]) =>
            invokeIpcContract(logIpcContracts.write, "debug", message, params),
        info: (message: string, ...params: unknown[]) =>
            invokeIpcContract(logIpcContracts.write, "info", message, params),
        warn: (message: string, ...params: unknown[]) =>
            invokeIpcContract(logIpcContracts.write, "warn", message, params),
        error: (message: string, ...params: unknown[]) =>
            invokeIpcContract(logIpcContracts.write, "error", message, params),
        export: () => invokeIpcContract(logIpcContracts.export),
    },
});
