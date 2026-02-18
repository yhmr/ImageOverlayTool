import { describe, expect, it } from "vitest";

import type { AnchorPos } from "@/shared/types/AnchorPos";
import type { ImageSet } from "@/shared/types/ImageSet";
import {
    applyScaleToImageSet,
    calculateImageScale,
    createResetImageSet,
    resetImageSetTransformation,
    resolveRelinkInitAnchorPos,
} from "@/renderer/image-settings/utils/imageListItemHelpers";

const createAnchors = (width: number, height: number): AnchorPos => ({
    lt: { x: 0, y: 0 },
    rt: { x: width, y: 0 },
    lb: { x: 0, y: height },
    rb: { x: width, y: height },
});

const createImageSet = (
    initAnchorPos: AnchorPos | null,
    currentAnchorPos: AnchorPos | null
): ImageSet => ({
    id: "img-1",
    path: "local-file://C:/tmp/a.png",
    sourceType: "file",
    transparency: 20,
    rotation: 30,
    initAnchorPos,
    currentAnchorPos,
    visible: false,
    filters: {
        binarization: { enabled: true, threshold: 200 },
        hsv: { enabled: true, h: 1, s: 2, v: 3 },
    },
});

describe("imageListItemHelpers", () => {
    it("resolveRelinkInitAnchorPos keeps current anchors when next image does not exist", () => {
        const current = createAnchors(100, 80);
        expect(
            resolveRelinkInitAnchorPos(current, {
                exists: false,
                width: 50,
                height: 50,
            })
        ).toEqual(current);
    });

    it("resolveRelinkInitAnchorPos creates initial anchors when current is null", () => {
        expect(
            resolveRelinkInitAnchorPos(null, {
                exists: true,
                width: 200,
                height: 120,
            })
        ).toEqual(createAnchors(200, 120));
    });

    it("resolveRelinkInitAnchorPos keeps current when current anchor size is invalid", () => {
        const invalid = {
            lt: { x: 10, y: 10 },
            rt: { x: 10, y: 10 },
            lb: { x: 10, y: 30 },
            rb: { x: 10, y: 30 },
        };
        expect(
            resolveRelinkInitAnchorPos(invalid, {
                exists: true,
                width: 200,
                height: 120,
            })
        ).toEqual(invalid);
    });

    it("resolveRelinkInitAnchorPos keeps anchors when size matches exactly", () => {
        const current = createAnchors(100, 80);
        expect(
            resolveRelinkInitAnchorPos(current, {
                exists: true,
                width: 100,
                height: 80,
            })
        ).toEqual(current);
    });

    it("resolveRelinkInitAnchorPos recreates anchors when only height differs", () => {
        const current = createAnchors(100, 80);
        expect(
            resolveRelinkInitAnchorPos(current, {
                exists: true,
                width: 100,
                height: 81,
            })
        ).toEqual(createAnchors(100, 81));
    });

    it("createResetImageSet resets transformation and visual properties", () => {
        const imageSet = createImageSet(createAnchors(20, 20), createAnchors(30, 30));
        const next = createResetImageSet(imageSet, "local-file://C:/tmp/next.png");

        expect(next.path).toBe("local-file://C:/tmp/next.png");
        expect(next.sourceType).toBe("file");
        expect(next.transparency).toBe(0);
        expect(next.rotation).toBe(0);
        expect(next.initAnchorPos).toBeNull();
        expect(next.currentAnchorPos).toBeNull();
        expect(next.visible).toBe(true);
        expect(next.filters).toEqual({
            binarization: { enabled: false, threshold: 128 },
            hsv: { enabled: false, h: 0, s: 0, v: 0 },
        });
    });

    it("calculateImageScale and applyScaleToImageSet handle missing/invalid anchors", () => {
        const imageSet = createImageSet(null, null);
        expect(calculateImageScale(imageSet)).toBe(1);
        expect(applyScaleToImageSet(imageSet, 2)).toBeNull();
    });

    it("applyScaleToImageSet rejects non-finite and non-positive scale, and applies valid scale", () => {
        const init = createAnchors(100, 80);
        const current = createAnchors(100, 80);
        const imageSet = createImageSet(init, current);

        expect(applyScaleToImageSet(imageSet, Number.NaN)).toBeNull();
        expect(applyScaleToImageSet(imageSet, 0)).toBeNull();

        const scaled = applyScaleToImageSet(imageSet, 2);
        expect(scaled?.currentAnchorPos?.rb.x).toBe(150);
        expect(scaled?.currentAnchorPos?.rb.y).toBe(120);
    });

    it("resetImageSetTransformation returns null for missing anchors and resets rotation otherwise", () => {
        expect(resetImageSetTransformation(createImageSet(null, null))).toBeNull();

        const init = createAnchors(100, 80);
        const current: AnchorPos = {
            lt: { x: 10, y: 10 },
            rt: { x: 110, y: 10 },
            lb: { x: 10, y: 90 },
            rb: { x: 110, y: 90 },
        };
        const imageSet = createImageSet(init, current);
        const reset = resetImageSetTransformation(imageSet);
        expect(reset?.rotation).toBe(0);
        expect(reset?.currentAnchorPos).toEqual(current);
    });
});
