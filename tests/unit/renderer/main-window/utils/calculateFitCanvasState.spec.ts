import type { ImageSet } from "@/shared/types/ImageSet";
import { calculateFitCanvasState } from "@/renderer/main-window/utils/calculateFitCanvasState";
import { describe, expect, it } from "vitest";

const createImageSet = (
    overrides: Partial<ImageSet>
): ImageSet => ({
    id: "image-id",
    path: "local-file://dummy.png",
    transparency: 0,
    rotation: 0,
    initAnchorPos: null,
    currentAnchorPos: {
        lt: { x: 0, y: 0 },
        rt: { x: 100, y: 0 },
        rb: { x: 100, y: 100 },
        lb: { x: 0, y: 100 },
    },
    locked: false,
    ...overrides,
});

describe("calculateFitCanvasState", () => {
    it("returns null when there are no visible images", () => {
        const result = calculateFitCanvasState({
            imageSets: [createImageSet({ path: "", currentAnchorPos: null })],
            viewportWidth: 800,
            viewportHeight: 600,
        });

        expect(result).toBeNull();
    });

    it("fits a single image into viewport", () => {
        const result = calculateFitCanvasState({
            imageSets: [createImageSet({})],
            viewportWidth: 200,
            viewportHeight: 100,
            paddingScale: 1,
        });

        expect(result).toEqual({ x: 50, y: 0, scale: 1 });
    });

    it("uses merged bounds across multiple images", () => {
        const result = calculateFitCanvasState({
            imageSets: [
                createImageSet({
                    currentAnchorPos: {
                        lt: { x: 0, y: 0 },
                        rt: { x: 100, y: 0 },
                        rb: { x: 100, y: 100 },
                        lb: { x: 0, y: 100 },
                    },
                }),
                createImageSet({
                    id: "image-2",
                    currentAnchorPos: {
                        lt: { x: 200, y: 0 },
                        rt: { x: 300, y: 0 },
                        rb: { x: 300, y: 100 },
                        lb: { x: 200, y: 100 },
                    },
                }),
            ],
            viewportWidth: 300,
            viewportHeight: 150,
            paddingScale: 1,
        });

        expect(result).toEqual({ x: 0, y: 25, scale: 1 });
    });

    it("includes image rotation in boundary calculation", () => {
        const result = calculateFitCanvasState({
            imageSets: [
                createImageSet({
                    rotation: 90,
                    currentAnchorPos: {
                        lt: { x: 0, y: 0 },
                        rt: { x: 100, y: 0 },
                        rb: { x: 100, y: 50 },
                        lb: { x: 0, y: 50 },
                    },
                }),
            ],
            viewportWidth: 100,
            viewportHeight: 100,
            paddingScale: 1,
        });

        expect(result?.scale).toBeCloseTo(1, 6);
        expect(result?.x).toBeCloseTo(0, 6);
        expect(result?.y).toBeCloseTo(25, 6);
    });
});
