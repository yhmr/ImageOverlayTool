import type { StoreApi } from "zustand";
import type { TemporalState } from "zundo";

export type TemporalStoreAccessor = () =>
    | StoreApi<TemporalState<unknown>>
    | undefined;

export const runAsSystemMutation = (
    getTemporal: TemporalStoreAccessor,
    mutation: () => void
): void => {
    const temporalState = getTemporal()?.getState();
    temporalState?.pause();

    try {
        mutation();
    } finally {
        temporalState?.resume();
    }
};

export const clearTemporalHistory = (
    getTemporal: TemporalStoreAccessor
): void => {
    getTemporal()?.getState().clear();
};
