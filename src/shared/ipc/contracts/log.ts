import { defineInvokeContract, type InvokeContract } from "../contract";
import { IPC_CHANNELS } from "../channels";

export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogInvokeContracts = {
    write: InvokeContract<
        [level: LogLevel, message: string, params: unknown[]],
        void
    >;
    export: InvokeContract<[], string | null>;
};

export const logIpcContracts: LogInvokeContracts = {
    write: defineInvokeContract(IPC_CHANNELS.log.write),
    export: defineInvokeContract(IPC_CHANNELS.log.export),
};
