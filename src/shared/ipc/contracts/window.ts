import { defineInvokeContract, type InvokeContract } from "../contract";
import { IPC_CHANNELS } from "../channels";

export type WindowRect = {
    x: number;
    y: number;
    width: number;
    height: number;
};

export type WindowInvokeContracts = {
    minimize: InvokeContract<[], void>;
    switchSize: InvokeContract<[], boolean>;
    close: InvokeContract<[], void>;
    setRect: InvokeContract<[rect: WindowRect], void>;
    setIgnoreMouseEvents: InvokeContract<[ignore: boolean], void>;
    setAlwaysOnTop: InvokeContract<[enabled: boolean], void>;
};

export const windowIpcContracts: WindowInvokeContracts = {
    minimize: defineInvokeContract(IPC_CHANNELS.window.minimize),
    switchSize: defineInvokeContract(IPC_CHANNELS.window.switchSize),
    close: defineInvokeContract(IPC_CHANNELS.window.close),
    setRect: defineInvokeContract(IPC_CHANNELS.window.setRect),
    setIgnoreMouseEvents: defineInvokeContract(
        IPC_CHANNELS.window.setIgnoreMouseEvents
    ),
    setAlwaysOnTop: defineInvokeContract(IPC_CHANNELS.window.setAlwaysOnTop),
};
