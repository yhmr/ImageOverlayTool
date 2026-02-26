import type { E2ERuntimeConfig } from "../../e2e/runtimeConfig";
import type { CaptureTestModeOptions } from "../../services/captureService";

export interface E2EControlRegistrationOptions {
    e2eConfig: E2ERuntimeConfig;
}

export interface E2EControlHandlerContext {
    e2eConfig: E2ERuntimeConfig;
    e2eImagePathAliases: {
        fixtures: string;
    };
    captureTestMode: CaptureTestModeOptions;
    getDisabledReason: () => string;
    isControlPlaneEnabled: () => boolean;
    assertControlPlaneEnabled: () => void;
}
