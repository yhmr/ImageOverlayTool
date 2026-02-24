import { describe, expect, it } from "vitest";
import { parseSceneFile } from "@/main/repositories/sceneSchema";
import { SCENE_FILE_VERSION } from "@/shared/types/SceneFile";

describe("parseSceneFile", () => {
    it("throws when root is not an object", () => {
        expect(() => parseSceneFile(null)).toThrow("root must be an object");
    });

    it("throws when version is unsupported", () => {
        expect(() =>
            parseSceneFile({
                version: "0.9.0",
                images: [],
            })
        ).toThrow("Unsupported scene file version");
    });

    it("throws when images is not an array", () => {
        expect(() =>
            parseSceneFile({
                version: SCENE_FILE_VERSION,
                images: {},
            })
        ).toThrow("images must be an array");
    });

    it("throws when image source is missing or empty", () => {
        expect(() =>
            parseSceneFile({
                version: SCENE_FILE_VERSION,
                images: [{}],
            })
        ).toThrow("images[0].source is required");

        expect(() =>
            parseSceneFile({
                version: SCENE_FILE_VERSION,
                images: [{ source: "" }],
            })
        ).toThrow("images[0].source is required");
    });

    it("throws when transparency is out of range", () => {
        expect(() =>
            parseSceneFile({
                version: SCENE_FILE_VERSION,
                images: [{ source: "a.png", transparency: 1.5 }],
            })
        ).toThrow("transparency must be between 0 and 1");
    });

    it("throws when window values are invalid", () => {
        expect(() =>
            parseSceneFile({
                version: SCENE_FILE_VERSION,
                window: { color: "not-a-color" },
                images: [],
            })
        ).toThrow("window.color is invalid");

        expect(() =>
            parseSceneFile({
                version: SCENE_FILE_VERSION,
                window: { clickThrough: "yes" },
                images: [],
            })
        ).toThrow("window.clickThrough must be a boolean");
    });

    it("throws when canvas shape is invalid", () => {
        expect(() =>
            parseSceneFile({
                version: SCENE_FILE_VERSION,
                images: [],
                canvas: 1,
            })
        ).toThrow("canvas must be an object");

        expect(() =>
            parseSceneFile({
                version: SCENE_FILE_VERSION,
                images: [],
                canvas: { x: 0, y: 0 },
            })
        ).toThrow("canvas.scale must be a number");
    });

    it("throws when filters are invalid", () => {
        expect(() =>
            parseSceneFile({
                version: SCENE_FILE_VERSION,
                images: [
                    {
                        source: "a.png",
                        filters: {
                            binarization: {
                                enabled: true,
                            },
                        },
                    },
                ],
            })
        ).toThrow("filters.binarization.threshold must be a number");

        expect(() =>
            parseSceneFile({
                version: SCENE_FILE_VERSION,
                images: [
                    {
                        source: "a.png",
                        filters: {
                            hsv: {
                                enabled: "true",
                                h: 0,
                                s: 0,
                                v: 0,
                            },
                        },
                    },
                ],
            })
        ).toThrow("filters.hsv.enabled must be a boolean");
    });

    it("parses valid scene input", () => {
        const scene = parseSceneFile({
            version: SCENE_FILE_VERSION,
            window: {
                color: "#abcdef12",
                alwaysOnTop: true,
                clickThrough: false,
                showWindowFrame: true,
            },
            unitFactor: 2,
            unit: "mm",
            canvas: { x: 10, y: 20, scale: 1.5 },
            images: [
                {
                    source: "relative/path.png",
                    id: "image-1",
                    transparency: 0.3,
                    rotation: 12,
                    locked: true,
                    visible: false,
                    filters: {
                        binarization: {
                            enabled: true,
                            threshold: 120,
                        },
                    },
                },
            ],
            dimensionLines: [
                {
                    id: "line-1",
                    start: { x: 0, y: 0 },
                    end: { x: 10, y: 10 },
                    color: "#ff00ff",
                    showUnitLabel: true,
                },
            ],
        });

        expect(scene.version).toBe(SCENE_FILE_VERSION);
        expect(scene.window).toEqual({
            color: "#abcdef12",
            alwaysOnTop: true,
            clickThrough: false,
            showWindowFrame: true,
        });
        expect(scene.unitFactor).toBe(2);
        expect(scene.unit).toBe("mm");
        expect(scene.canvas).toEqual({ x: 10, y: 20, scale: 1.5 });
        expect(scene.images).toHaveLength(1);
        expect(scene.images[0]).toEqual({
            source: "relative/path.png",
            id: "image-1",
            transparency: 0.3,
            rotation: 12,
            locked: true,
            visible: false,
            filters: {
                binarization: {
                    enabled: true,
                    threshold: 120,
                },
            },
        });
        expect(scene.dimensionLines).toEqual([
            {
                id: "line-1",
                start: { x: 0, y: 0 },
                end: { x: 10, y: 10 },
                color: "#ff00ff",
                showUnitLabel: true,
            },
        ]);
    });
});
