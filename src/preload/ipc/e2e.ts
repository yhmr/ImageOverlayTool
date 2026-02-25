import { IPC_CHANNELS } from "../../shared/ipc/channels";
import type {
    E2ECaptureRequest,
    E2EControlStatus,
    E2ELoadFixtureImageRequest,
    E2EResolvedFixtureImage,
    E2EResolvedSceneFile,
    E2EWaitStableRequest,
    E2EWaitStableResult,
} from "../../shared/types/E2EControl";
import { invokeIpc } from "./client";

export const createE2EApi = () => ({
    getE2EStatus: (): Promise<E2EControlStatus> =>
        invokeIpc(IPC_CHANNELS.e2e.getStatus),
    e2eSetSceneFromPath: (scenePath: string): Promise<E2EResolvedSceneFile> =>
        invokeIpc(IPC_CHANNELS.e2e.setSceneFromPath, scenePath),
    e2eLoadFixtureImage: (
        request: E2ELoadFixtureImageRequest
    ): Promise<E2EResolvedFixtureImage> =>
        invokeIpc(IPC_CHANNELS.e2e.loadFixtureImage, request),
    e2eWaitStable: (
        request?: E2EWaitStableRequest
    ): Promise<E2EWaitStableResult> =>
        invokeIpc(IPC_CHANNELS.e2e.waitStable, request),
    e2eCapture: (request?: E2ECaptureRequest) =>
        invokeIpc(IPC_CHANNELS.e2e.capture, request),
});
