import type { IElectronAPI, Unit } from "../shared/ipc/electronApi";
import type { CaptureResult } from "../shared/types/CaptureResult";
import type {
    E2ECaptureRequest,
    E2EControlStatus,
    E2EFixtureImageOverrides,
    E2EWaitStableRequest,
    E2EWaitStableResult,
} from "../shared/types/E2EControl";
import type { InteractionMode } from "../shared/types/InteractionMode";

export type { IElectronAPI };

export interface IE2EBridgeAPI {
    getStatus: () => Promise<E2EControlStatus>;
    getState: () => {
        imageCount: number;
        dimensionLineCount: number;
        selectedImageId: string | null;
        selectedDimensionLineId: string | null;
        interactionMode: InteractionMode;
        unit: Unit;
        unitFactor: number;
        windowColor: string;
        isUIHidden: boolean;
    };
    setSceneFromPath: (scenePath: string) => Promise<E2EWaitStableResult>;
    loadFixtureImage: (
        source: string,
        overrides?: E2EFixtureImageOverrides
    ) => Promise<E2EWaitStableResult>;
    waitStable: (
        request?: E2EWaitStableRequest
    ) => Promise<E2EWaitStableResult>;
    capture: (request?: E2ECaptureRequest) => Promise<CaptureResult | null>;
}

declare global {
    interface Window {
        electronAPI: IElectronAPI;
        __IOT_E2E__?: IE2EBridgeAPI;
    }
}

declare module "*.png" {
    const value: string;
    export default value;
}
