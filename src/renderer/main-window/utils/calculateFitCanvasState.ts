import type { ImageSet } from "@/shared/types/ImageSet";
import { getCenter, rotatePoint } from "@/renderer/utils/anchorUtils";

type Bounds = {
    left: number;
    top: number;
    right: number;
    bottom: number;
};

type FitCanvasOptions = {
    imageSets: ImageSet[];
    viewportWidth: number;
    viewportHeight: number;
    paddingScale?: number;
};

type CanvasState = {
    x: number;
    y: number;
    scale: number;
};

const clamp = (value: number, min: number, max: number): number =>
    Math.min(Math.max(value, min), max);

const getImageBounds = (imageSet: ImageSet): Bounds | null => {
    if (!imageSet.path || !imageSet.currentAnchorPos) {
        return null;
    }

    const anchors = imageSet.currentAnchorPos;
    const center = getCenter(anchors);
    const rotation = imageSet.rotation ?? 0;

    const points = [anchors.lt, anchors.rt, anchors.rb, anchors.lb].map(
        (point) => rotatePoint(point, center, rotation)
    );

    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);

    return {
        left: Math.min(...xs),
        top: Math.min(...ys),
        right: Math.max(...xs),
        bottom: Math.max(...ys),
    };
};

const mergeBounds = (a: Bounds, b: Bounds): Bounds => {
    return {
        left: Math.min(a.left, b.left),
        top: Math.min(a.top, b.top),
        right: Math.max(a.right, b.right),
        bottom: Math.max(a.bottom, b.bottom),
    };
};

export const calculateFitCanvasState = (
    options: FitCanvasOptions
): CanvasState | null => {
    const {
        imageSets,
        viewportWidth,
        viewportHeight,
        paddingScale = 0.95,
    } = options;

    if (viewportWidth <= 0 || viewportHeight <= 0) {
        return null;
    }

    let mergedBounds: Bounds | null = null;
    for (const imageSet of imageSets) {
        const bounds = getImageBounds(imageSet);
        if (!bounds) {
            continue;
        }
        mergedBounds = mergedBounds
            ? mergeBounds(mergedBounds, bounds)
            : bounds;
    }

    if (!mergedBounds) {
        return null;
    }

    const boundsWidth = Math.max(mergedBounds.right - mergedBounds.left, 1);
    const boundsHeight = Math.max(mergedBounds.bottom - mergedBounds.top, 1);

    const rawScale =
        Math.min(viewportWidth / boundsWidth, viewportHeight / boundsHeight) *
        paddingScale;
    const scale = clamp(rawScale, 0.01, 100);

    const x =
        (viewportWidth - boundsWidth * scale) / 2 - mergedBounds.left * scale;
    const y =
        (viewportHeight - boundsHeight * scale) / 2 - mergedBounds.top * scale;

    return { x, y, scale };
};
