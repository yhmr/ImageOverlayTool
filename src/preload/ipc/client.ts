import { ipcRenderer } from "electron";
import {
    invokeByContract,
    type EventArgs,
    type EventContract,
    type InvokeArgs,
    type InvokeContract,
    type InvokeResult,
} from "../../shared/ipc/contract";

export const invokeIpc = <TReturn = void>(
    channel: string,
    ...args: unknown[]
): Promise<TReturn> => ipcRenderer.invoke(channel, ...args) as Promise<TReturn>;

export const onIpcEvent = <TArgs extends unknown[]>(
    event: string,
    callback: (...args: TArgs) => void
): (() => void) => {
    const listener = (_event: unknown, ...args: TArgs) => callback(...args);
    ipcRenderer.on(event, listener);
    return () => ipcRenderer.removeListener(event, listener);
};

export const invokeIpcContract = <
    TContract extends InvokeContract<unknown[], unknown>
>(
    contract: TContract,
    ...args: InvokeArgs<TContract>
): Promise<InvokeResult<TContract>> =>
    invokeByContract(
        (channel, ...invokeArgs) => ipcRenderer.invoke(channel, ...invokeArgs),
        contract,
        ...args
    );

export const onIpcEventContract = <TContract extends EventContract<unknown[]>>(
    contract: TContract,
    callback: (...args: EventArgs<TContract>) => void
): (() => void) => {
    const listener = (_event: unknown, ...args: unknown[]) =>
        callback(...(args as EventArgs<TContract>));

    ipcRenderer.on(contract.event, listener);
    return () => ipcRenderer.removeListener(contract.event, listener);
};
