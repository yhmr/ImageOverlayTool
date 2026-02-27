/**
 * Request/Response型のIPC通信に紐づける引数および戻り値の型定義(契約)インターフェース
 */
export interface InvokeContract<TArgs extends unknown[] = [], TResult = void> {
    readonly kind: "invoke";
    readonly channel: string;
    readonly __args?: TArgs;
    readonly __result?: TResult;
}

/**
 * Publish/Subscribe型(イベント通知)のIPC通信に紐づける引数の型定義(契約)インターフェース
 */
export interface EventContract<TArgs extends unknown[] = []> {
    readonly kind: "event";
    readonly event: string;
    readonly __args?: TArgs;
}

export type InvokeArgs<TContract> = TContract extends InvokeContract<
    infer TArgs,
    unknown
>
    ? TArgs
    : never;

export type InvokeResult<TContract> = TContract extends InvokeContract<
    unknown[],
    infer TResult
>
    ? TResult
    : never;

export type EventArgs<TContract> = TContract extends EventContract<infer TArgs>
    ? TArgs
    : never;

/**
 * 引数と戻り値の型情報を結びつけたRequest/Response型のIPC通信の契約定義オブジェクトを生成します。
 *
 * @param channel 対象のIPCチャンネル名
 */
export const defineInvokeContract = <
    TArgs extends unknown[] = [],
    TResult = void
>(
    channel: string
): InvokeContract<TArgs, TResult> => ({
    kind: "invoke",
    channel,
});

/**
 * 引数の型情報を結びつけたイベント通知型のIPC通信の契約定義オブジェクトを生成します。
 *
 * @param event 対象のIPCイベント名
 */
export const defineEventContract = <TArgs extends unknown[] = []>(
    event: string
): EventContract<TArgs> => ({
    kind: "event",
    event,
});

/**
 * 型定義されたInvokeContractに従ってIPC通信を実行するためのヘルパー関数です。
 *
 * @param invoke 実際のIPC通信処理(ipcRenderer.invoke等)
 * @param contract 呼び出し対象の契約定義(チャンネル名や型のメタ情報)
 * @param args 契約定義に基づく引数リスト
 */
export const invokeByContract = <
    TContract extends InvokeContract<unknown[], unknown>
>(
    invoke: (channel: string, ...args: unknown[]) => Promise<unknown>,
    contract: TContract,
    ...args: InvokeArgs<TContract>
): Promise<InvokeResult<TContract>> =>
    invoke(contract.channel, ...args) as Promise<InvokeResult<TContract>>;
