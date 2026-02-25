import { e2eIpcContracts } from "../../shared/ipc/contracts";
import type {
    E2ECaptureRequest,
    E2EControlStatus,
    E2ELoadFixtureImageRequest,
    E2EResolvedFixtureImage,
    E2EResolvedSceneFile,
    E2EWaitStableRequest,
    E2EWaitStableResult,
} from "../../shared/types/E2EControl";
import { invokeIpcContract } from "./client";

export const createE2EApi = () => ({
    getE2EStatus: (): Promise<E2EControlStatus> =>
        invokeIpcContract(e2eIpcContracts.getStatus),
    e2eSetSceneFromPath: (scenePath: string): Promise<E2EResolvedSceneFile> =>
        invokeIpcContract(e2eIpcContracts.setSceneFromPath, scenePath),
    e2eLoadFixtureImage: (
        request: E2ELoadFixtureImageRequest
    ): Promise<E2EResolvedFixtureImage> =>
        invokeIpcContract(e2eIpcContracts.loadFixtureImage, request),
    e2eWaitStable: (
        request?: E2EWaitStableRequest
    ): Promise<E2EWaitStableResult> =>
        invokeIpcContract(e2eIpcContracts.waitStable, request),
    e2eCapture: (request?: E2ECaptureRequest) =>
        invokeIpcContract(e2eIpcContracts.capture, request),
});
