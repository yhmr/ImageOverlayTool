import { ipcRenderer } from "electron";
import {
    invokeByContract,
    type EventArgs,
    type EventContract,
    type InvokeArgs,
    type InvokeContract,
    type InvokeResult,
} from "../../shared/ipc/contract";

/**
 * 型安全なIPC通信(Request/Response)を実行するブリッジ関数。
 * 契約定義に基づいて `ipcRenderer.invoke` を呼び出します。
 *
 * @param contract IPCのチャンネルや型情報を持つ契約定義
 * @param args 契約で定義された引数
 * @returns 契約で定義された戻り値のPromise
 */
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

/**
 * 型安全なIPCイベント通信(Publish/Subscribe)のリスナーを登録するブリッジ関数。
 * 契約定義に基づいて `ipcRenderer.on` でイベントを購読します。
 *
 * @param contract IPCのイベント名や型情報を持つ通信契約定義
 * @param callback イベント受信時に実行されるコールバック関数
 * @returns 登録したリスナーを解除する関数
 */
export const onIpcEventContract = <TContract extends EventContract<unknown[]>>(
    contract: TContract,
    callback: (...args: EventArgs<TContract>) => void
): (() => void) => {
    const listener = (_event: unknown, ...args: unknown[]) =>
        callback(...(args as EventArgs<TContract>));

    ipcRenderer.on(contract.event, listener);
    return () => ipcRenderer.removeListener(contract.event, listener);
};
