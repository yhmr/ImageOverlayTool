/**
 * @vitest-environment node
 */
import { describe, expect, it } from "vitest";

import {
    getCacheImageLocalPaths,
    resolveCacheImagePaths,
} from "@/renderer/services/project/resolveCacheImages";
import type { ImageSet } from "@/shared/types/ImageSet";

const createImageSet = (overrides: Partial<ImageSet> = {}): ImageSet => ({
    id: "image-1",
    path: "local-file://C:/tmp/default.png",
    sourceType: "file",
    transparency: 0,
    rotation: 0,
    initAnchorPos: null,
    currentAnchorPos: null,
    ...overrides,
});

describe("resolveCacheImages", () => {
    it("collects only local cache image paths", () => {
        const imageSets: ImageSet[] = [
            createImageSet({
                id: "cache-valid",
                sourceType: "cache",
                path: "local-file://C:/cache/a.png",
            }),
            createImageSet({
                id: "cache-invalid",
                sourceType: "cache",
                path: "not-local-path",
            }),
            createImageSet({
                id: "file",
                sourceType: "file",
                path: "local-file://C:/images/a.png",
            }),
        ];

        expect(getCacheImageLocalPaths(imageSets)).toEqual(["C:/cache/a.png"]);
    });

    it("resolves cache replacements and keeps non-target images", () => {
        const imageSets: ImageSet[] = [
            createImageSet({
                id: "cache-target",
                sourceType: "cache",
                path: "local-file://C:/cache/a.png",
            }),
            createImageSet({
                id: "cache-keep",
                sourceType: "cache",
                path: "local-file://C:/cache/b.png",
            }),
            createImageSet({
                id: "file-keep",
                sourceType: "file",
                path: "local-file://C:/images/a.png",
            }),
        ];

        const result = resolveCacheImagePaths(imageSets, {
            "C:/cache/a.png": "C:/project/assets/a.png",
        });

        expect(result.missingPaths).toEqual(["C:/cache/b.png"]);
        expect(result.cacheImagePathsToDelete).toEqual([
            "C:/cache/a.png",
            "C:/cache/b.png",
        ]);
        expect(result.nextImageSets).toEqual([
            expect.objectContaining({
                id: "cache-target",
                sourceType: "file",
                path: "local-file://C:/project/assets/a.png",
            }),
            expect.objectContaining({
                id: "cache-keep",
                sourceType: "cache",
                path: "local-file://C:/cache/b.png",
            }),
            expect.objectContaining({
                id: "file-keep",
                sourceType: "file",
                path: "local-file://C:/images/a.png",
            }),
        ]);
    });
});
