import type { DimensionLine } from "./DimensionLine";
import type { ImageSet } from "./ImageSet";

export const SCENE_FILE_VERSION = "1.0.0";

export type SceneUnit = "nm" | "um" | "mm";

export interface SceneWindowSettings {
    color?: string;
    alwaysOnTop?: boolean;
    clickThrough?: boolean;
    showWindowFrame?: boolean;
}

export interface SceneCanvasState {
    x: number;
    y: number;
    scale: number;
}

export interface SceneImageInput {
    source: string;
    id?: string;
    transparency?: number;
    rotation?: number;
    locked?: boolean;
    visible?: boolean;
    filters?: ImageSet["filters"];
}

export interface SceneFile {
    version: string;
    window?: SceneWindowSettings;
    unitFactor?: number;
    unit?: SceneUnit;
    canvas?: SceneCanvasState;
    images: SceneImageInput[];
    dimensionLines?: DimensionLine[];
}

export interface ResolvedSceneImage {
    path: string;
    id?: string;
    transparency?: number;
    rotation?: number;
    locked?: boolean;
    visible?: boolean;
    filters?: ImageSet["filters"];
}

export interface ResolvedSceneFile {
    version: string;
    window?: SceneWindowSettings;
    unitFactor?: number;
    unit?: SceneUnit;
    canvas?: SceneCanvasState;
    images: ResolvedSceneImage[];
    dimensionLines?: DimensionLine[];
}
