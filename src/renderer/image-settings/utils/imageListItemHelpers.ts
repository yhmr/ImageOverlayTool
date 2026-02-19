import type { AnchorPos } from "../../../shared/types/AnchorPos";
import type { ImageSet } from "../../../shared/types/ImageSet";
import {
    calculateAnchorScale,
    resetTransformation as resetAnchors,
    scaleAnchorPos,
} from "../../utils/anchorUtils";

interface ImageInfo {
    exists: boolean;
    width?: number;
    height?: number;
}

const createInitialAnchors = (width: number, height: number): AnchorPos => ({
    lt: { x: 0, y: 0 },
    lb: { x: 0, y: height },
    rt: { x: width, y: 0 },
    rb: { x: width, y: height },
});

const getAnchorSize = (
    anchorPos: AnchorPos | null
): { width: number; height: number } | null => {
    if (!anchorPos) {
        return null;
    }

    const width = Math.abs(anchorPos.rt.x - anchorPos.lt.x);
    const height = Math.abs(anchorPos.lb.y - anchorPos.lt.y);
    if (width <= 0 || height <= 0) {
        return null;
    }

    return { width, height };
};

export const createDefaultFilters = (): NonNullable<ImageSet["filters"]> => ({
    binarization: { enabled: false, threshold: 128 },
    hsv: { enabled: false, h: 0, s: 0, v: 0 },
});

export const resolveRelinkInitAnchorPos = (
    currentInitAnchorPos: AnchorPos | null,
    nextInfo: ImageInfo
): AnchorPos | null => {
    const currentSize = getAnchorSize(currentInitAnchorPos);

    if (!nextInfo.exists || !nextInfo.width || !nextInfo.height) {
        return currentInitAnchorPos;
    }

    if (!currentInitAnchorPos) {
        return createInitialAnchors(nextInfo.width, nextInfo.height);
    }

    if (!currentSize) {
        return currentInitAnchorPos;
    }

    const sameSize =
        currentSize.width === nextInfo.width &&
        currentSize.height === nextInfo.height;

    if (sameSize) {
        return currentInitAnchorPos;
    }

    return createInitialAnchors(nextInfo.width, nextInfo.height);
};

export const createResetImageSet = (
    imageSet: ImageSet,
    path: string
): ImageSet => ({
    ...imageSet,
    path,
    sourceType: "file",
    transparency: 0,
    rotation: 0,
    initAnchorPos: null,
    currentAnchorPos: null,
    visible: true,
    filters: createDefaultFilters(),
});

export const calculateImageScale = (imageSet: ImageSet): number => {
    if (!imageSet.initAnchorPos || !imageSet.currentAnchorPos) {
        return 1;
    }

    return calculateAnchorScale(
        imageSet.initAnchorPos,
        imageSet.currentAnchorPos
    );
};

export const applyScaleToImageSet = (
    imageSet: ImageSet,
    nextScale: number
): ImageSet | null => {
    if (!imageSet.initAnchorPos || !imageSet.currentAnchorPos) {
        return null;
    }

    if (!Number.isFinite(nextScale) || nextScale <= 0) {
        return null;
    }

    const currentScale = calculateAnchorScale(
        imageSet.initAnchorPos,
        imageSet.currentAnchorPos
    );
    const scaleRatio = nextScale / currentScale;
    const nextAnchorPos = scaleAnchorPos(imageSet.currentAnchorPos, scaleRatio);

    return {
        ...imageSet,
        currentAnchorPos: nextAnchorPos,
    };
};

export const resetImageSetTransformation = (
    imageSet: ImageSet
): ImageSet | null => {
    if (!imageSet.initAnchorPos || !imageSet.currentAnchorPos) {
        return null;
    }

    const nextAnchorPos = resetAnchors(
        imageSet.initAnchorPos,
        imageSet.currentAnchorPos
    );

    return {
        ...imageSet,
        currentAnchorPos: nextAnchorPos,
        rotation: 0,
    };
};
