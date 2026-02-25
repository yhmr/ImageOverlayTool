import { IPC_CHANNELS } from "../../shared/ipc/channels";
import { invokeIpc } from "./client";

export const createLogApi = () => ({
    log: {
        debug: (message: string, ...params: unknown[]) =>
            invokeIpc(IPC_CHANNELS.log.write, "debug", message, params),
        info: (message: string, ...params: unknown[]) =>
            invokeIpc(IPC_CHANNELS.log.write, "info", message, params),
        warn: (message: string, ...params: unknown[]) =>
            invokeIpc(IPC_CHANNELS.log.write, "warn", message, params),
        error: (message: string, ...params: unknown[]) =>
            invokeIpc(IPC_CHANNELS.log.write, "error", message, params),
        export: () => invokeIpc<string | null>(IPC_CHANNELS.log.export),
    },
});
