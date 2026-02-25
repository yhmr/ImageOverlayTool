import type {
    E2ECaptureRequest,
    E2ELoadFixtureImageRequest,
    E2EWaitStableRequest,
} from "../../../shared/types/E2EControl";
import { getElectronApi } from "./electronApi";
import type { IElectronAPI } from "../../../shared/ipc/electronApi";

type E2EIPCService = Pick<
    IElectronAPI,
    | "getE2EStatus"
    | "e2eSetSceneFromPath"
    | "e2eLoadFixtureImage"
    | "e2eWaitStable"
    | "e2eCapture"
>;

export const createE2EIPCService = (): E2EIPCService => ({
    getE2EStatus: () => getElectronApi().getE2EStatus(),
    e2eSetSceneFromPath: (scenePath: string) =>
        getElectronApi().e2eSetSceneFromPath(scenePath),
    e2eLoadFixtureImage: (request: E2ELoadFixtureImageRequest) =>
        getElectronApi().e2eLoadFixtureImage(request),
    e2eWaitStable: (request?: E2EWaitStableRequest) =>
        getElectronApi().e2eWaitStable(request),
    e2eCapture: (request?: E2ECaptureRequest) =>
        getElectronApi().e2eCapture(request),
});
