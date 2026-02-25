import type { CaptureResult } from "../../types/CaptureResult";
import type {
    E2ECaptureRequest,
    E2EControlStatus,
    E2ELoadFixtureImageRequest,
    E2EResolvedFixtureImage,
    E2EResolvedSceneFile,
    E2EWaitStableRequest,
    E2EWaitStableResult,
} from "../../types/E2EControl";
import { defineInvokeContract, type InvokeContract } from "../contract";
import { IPC_CHANNELS } from "../channels";

export type E2EInvokeContracts = {
    getStatus: InvokeContract<[], E2EControlStatus>;
    setSceneFromPath: InvokeContract<[scenePath: string], E2EResolvedSceneFile>;
    loadFixtureImage: InvokeContract<
        [request: E2ELoadFixtureImageRequest],
        E2EResolvedFixtureImage
    >;
    waitStable: InvokeContract<
        [request?: E2EWaitStableRequest],
        E2EWaitStableResult
    >;
    capture: InvokeContract<
        [request?: E2ECaptureRequest],
        CaptureResult | null
    >;
};

export const e2eIpcContracts: E2EInvokeContracts = {
    getStatus: defineInvokeContract(IPC_CHANNELS.e2e.getStatus),
    setSceneFromPath: defineInvokeContract(IPC_CHANNELS.e2e.setSceneFromPath),
    loadFixtureImage: defineInvokeContract(IPC_CHANNELS.e2e.loadFixtureImage),
    waitStable: defineInvokeContract(IPC_CHANNELS.e2e.waitStable),
    capture: defineInvokeContract(IPC_CHANNELS.e2e.capture),
};
