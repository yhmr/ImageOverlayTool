import { defineInvokeContract, type InvokeContract } from "../contract";
import { IPC_CHANNELS } from "../channels";

/** ログ出力の重要度レベル */
export type LogLevel = "debug" | "info" | "warn" | "error";

/**
 * ロギング関連のIPC通信におけるRequest/Responseの型定義群
 */
export type LogInvokeContracts = {
    write: InvokeContract<
        [level: LogLevel, message: string, params: unknown[]],
        void
    >;
    export: InvokeContract<[], string | null>;
};

/**
 * ロギング関連IPC通信の契約定義オブジェクト
 */
export const logIpcContracts: LogInvokeContracts = {
    write: defineInvokeContract(IPC_CHANNELS.log.write),
    export: defineInvokeContract(IPC_CHANNELS.log.export),
};
