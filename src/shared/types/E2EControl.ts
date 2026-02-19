import type { AnchorPos } from "./AnchorPos";
import type { DimensionLine } from "./DimensionLine";
import type { ImageSet } from "./ImageSet";
import type { InteractionMode } from "./InteractionMode";

export type E2EUnit = "nm" | "um" | "mm";
export type E2EInteractionMode = InteractionMode;
export type E2ECaptureMode = "window" | "screen";

export interface E2ESceneImageInput {
    source: string;
    id?: string;
    transparency?: number;
    rotation?: number;
    initAnchorPos?: AnchorPos | null;
    currentAnchorPos?: AnchorPos | null;
    locked?: boolean;
    visible?: boolean;
    filters?: ImageSet["filters"];
}

export interface E2EResolvedSceneImage {
    path: string;
    id?: string;
    transparency?: number;
    rotation?: number;
    initAnchorPos?: AnchorPos | null;
    currentAnchorPos?: AnchorPos | null;
    locked?: boolean;
    visible?: boolean;
    filters?: ImageSet["filters"];
}

export interface E2ESceneInput {
    name?: string;
    unitFactor?: number;
    unit?: E2EUnit;
    windowColor?: string;
    canvas?: {
        x: number;
        y: number;
        scale: number;
    };
    interactionMode?: E2EInteractionMode;
    selectedImageId?: string | null;
    selectedDimensionLineId?: string | null;
    uiHidden?: boolean;
    images: E2ESceneImageInput[];
    dimensionLines?: DimensionLine[];
}

export interface E2EResolvedScene {
    name?: string;
    unitFactor?: number;
    unit?: E2EUnit;
    windowColor?: string;
    canvas?: {
        x: number;
        y: number;
        scale: number;
    };
    interactionMode?: E2EInteractionMode;
    selectedImageId?: string | null;
    selectedDimensionLineId?: string | null;
    uiHidden?: boolean;
    images: E2EResolvedSceneImage[];
    dimensionLines?: DimensionLine[];
}

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
