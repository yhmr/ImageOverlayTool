export interface InvokeContract<TArgs extends unknown[] = [], TResult = void> {
    readonly kind: "invoke";
    readonly channel: string;
    readonly __args?: TArgs;
    readonly __result?: TResult;
}

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

export const defineInvokeContract = <
    TArgs extends unknown[] = [],
    TResult = void
>(
    channel: string
): InvokeContract<TArgs, TResult> => ({
    kind: "invoke",
    channel,
});

export const defineEventContract = <TArgs extends unknown[] = []>(
    event: string
): EventContract<TArgs> => ({
    kind: "event",
    event,
});

export const invokeByContract = <
    TContract extends InvokeContract<unknown[], unknown>
>(
    invoke: (channel: string, ...args: unknown[]) => Promise<unknown>,
    contract: TContract,
    ...args: InvokeArgs<TContract>
): Promise<InvokeResult<TContract>> =>
    invoke(contract.channel, ...args) as Promise<InvokeResult<TContract>>;
