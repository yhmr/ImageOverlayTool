import type { AnchorPos } from "./AnchorPos";
import type { ImageSet } from "./ImageSet";
import type { InteractionMode } from "./InteractionMode";
import type { ResolvedSceneFile } from "./SceneFile";

export type E2ECaptureMode = "window" | "screen";

export interface E2EFixtureImageOverrides {
    id?: string;
    transparency?: number;
    rotation?: number;
    initAnchorPos?: AnchorPos | null;
    currentAnchorPos?: AnchorPos | null;
    locked?: boolean;
    visible?: boolean;
    filters?: ImageSet["filters"];
}

export interface E2ESceneExtensions {
    name?: string;
    interactionMode?: InteractionMode;
    selectedImageId?: string | null;
    selectedDimensionLineId?: string | null;
    uiHidden?: boolean;
}

export type E2EResolvedSceneFile = ResolvedSceneFile & E2ESceneExtensions;

export interface E2ELoadFixtureImageRequest {
    source: string;
}

export interface E2EResolvedFixtureImage {
    path: string;
}

export interface E2EWaitStableRequest {
    timeoutMs?: number;
}

export interface E2EWaitStableResult {
    stable: boolean;
    elapsedMs: number;
}

export interface E2ECaptureRequest {
    mode?: E2ECaptureMode;
}

export interface E2EControlStatus {
    enabled: boolean;
    artifactsDir: string;
    fixturesDir: string;
    reason?: string;
}
