/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, beforeEach } from "vitest";
import { useAppStore } from "@/renderer/store/useAppStore";
import { ImageSet } from "@/shared/types/ImageSet";
import { DimensionLine } from "@/shared/types/DimensionLine";
import type { ProjectFile } from "@/shared/types/ProjectFile";
import {
    UNIT_FACTOR_DEFAULT,
    UNIT_FACTOR_MIN,
} from "@/shared/constants/unitFactor";

describe("useAppStore", () => {
    beforeEach(() => {
        useAppStore.getState().resetAll();
    });

    describe("ProjectDataSlice", () => {
        const sampleImageSet: ImageSet = {
            id: "img1",
            path: "path/to/img1.png",
            sourceType: "file",
            transparency: 0.8,
            rotation: 0,
            initAnchorPos: null,
            currentAnchorPos: null,
        };

        describe("Image Sets Actions", () => {
            it("should set image sets", () => {
                const newSets = [sampleImageSet];
                useAppStore.getState().setImageSets(newSets);

                const state = useAppStore.getState();
                expect(state.imageSets).toEqual(newSets);
                expect(state.projectDataChangeOrigin).toBe("local");
            });

            it("should replace default empty slot when adding image set with path", () => {
                useAppStore
                    .getState()
                    .addImageSetWithPath("C:\\tmp\\first-image.png");

                const state = useAppStore.getState();
                expect(state.imageSets).toHaveLength(1);
                expect(state.imageSets[0].path).toBe(
                    "local-file://C:/tmp/first-image.png"
                );
                expect(state.projectDataChangeOrigin).toBe("local");
            });

            it("should append image sets when list already has images", () => {
                useAppStore
                    .getState()
                    .addImageSetWithPath("C:\\tmp\\first-image.png");
                useAppStore
                    .getState()
                    .addImageSetWithPath("C:\\tmp\\second-image.jpg");

                const state = useAppStore.getState();
                expect(state.imageSets).toHaveLength(2);
                expect(state.imageSets[0].path).toBe(
                    "local-file://C:/tmp/first-image.png"
                );
                expect(state.imageSets[1].path).toBe(
                    "local-file://C:/tmp/second-image.jpg"
                );
            });

            it("should ignore addImageSetWithPath when path is empty", () => {
                const before = useAppStore.getState().imageSets;
                useAppStore.getState().addImageSetWithPath("");
                expect(useAppStore.getState().imageSets).toEqual(before);
            });

            it("should sync image sets as remote change", () => {
                const newSets = [sampleImageSet];
                useAppStore.getState().syncImageSets(newSets);

                const state = useAppStore.getState();
                expect(state.imageSets).toEqual(newSets);
                expect(state.projectDataChangeOrigin).toBe("remote");
            });

            it("should update image set by index", () => {
                const initialSet: ImageSet = { ...sampleImageSet, path: "old.png" };
                useAppStore.getState().setImageSets([initialSet]);

                const updatedSet: ImageSet = { ...sampleImageSet, path: "new.png" };
                useAppStore.getState().updateImageSet({ index: 0, imageSet: updatedSet });

                const state = useAppStore.getState();
                expect(state.imageSets[0]).toEqual(updatedSet);
                expect(state.projectDataChangeOrigin).toBe("local");
            });

            it("should update image set by id", () => {
                const a: ImageSet = { ...sampleImageSet, id: "a", path: "a.png" };
                const b: ImageSet = { ...sampleImageSet, id: "b", path: "b.png" };
                useAppStore.getState().setImageSets([a, b]);
                const updatedB: ImageSet = { ...b, path: "updated-b.png" };

                useAppStore
                    .getState()
                    .updateImageSet({ id: "b", imageSet: updatedB });

                const state = useAppStore.getState();
                expect(state.imageSets[0]?.path).toBe("a.png");
                expect(state.imageSets[1]).toEqual(updatedB);
            });

            it("should keep image sets unchanged when updateImageSet index/id is invalid", () => {
                const initialSet: ImageSet = { ...sampleImageSet, path: "old.png" };
                useAppStore.getState().setImageSets([initialSet]);

                useAppStore.getState().updateImageSet({
                    index: 5,
                    imageSet: { ...sampleImageSet, path: "out-of-range.png" },
                });
                useAppStore.getState().updateImageSet({
                    imageSet: { ...sampleImageSet, path: "no-target.png" },
                });

                const state = useAppStore.getState();
                expect(state.imageSets).toHaveLength(1);
                expect(state.imageSets[0]?.path).toBe("old.png");
            });
        });

        describe("Unit Factor Actions", () => {
            it("should update unit factor", () => {
                useAppStore.getState().setUnitFactor(2.5);
                expect(useAppStore.getState().unitFactor).toBe(2.5);
                expect(useAppStore.getState().projectDataChangeOrigin).toBe("local");
            });

            it("should sync unit factor as remote change", () => {
                useAppStore.getState().syncUnitFactor(3.0);
                expect(useAppStore.getState().unitFactor).toBe(3.0);
                expect(useAppStore.getState().projectDataChangeOrigin).toBe("remote");
            });

            it("should sanitize NaN and negative unit factor values", () => {
                useAppStore.getState().setUnitFactor(Number.NaN);
                expect(useAppStore.getState().unitFactor).toBe(UNIT_FACTOR_DEFAULT);

                useAppStore.getState().setUnitFactor(-5);
                expect(useAppStore.getState().unitFactor).toBe(UNIT_FACTOR_MIN);
            });
        });

        describe("Dimension Lines Actions", () => {
            const sampleLine: DimensionLine = {
                id: "line1",
                start: { x: 0, y: 0 },
                end: { x: 100, y: 100 },
            };

            it("should add a dimension line", () => {
                useAppStore.getState().addDimensionLine(sampleLine);
                expect(useAppStore.getState().dimensionLines).toContain(sampleLine);
            });

            it("should remove a dimension line", () => {
                useAppStore.getState().addDimensionLine(sampleLine);
                useAppStore.getState().removeDimensionLine(sampleLine.id);
                expect(useAppStore.getState().dimensionLines).not.toContain(sampleLine);
            });

            it("should ignore updateDimensionLine when target id is missing", () => {
                useAppStore.getState().setDimensionLines([sampleLine]);
                useAppStore.getState().updateDimensionLine({
                    ...sampleLine,
                    id: "unknown",
                    start: { x: 99, y: 99 },
                });
                expect(useAppStore.getState().dimensionLines).toEqual([sampleLine]);
            });
        });
    });

    describe("InteractionSlice", () => {
        it("should change interaction mode", () => {
            useAppStore.getState().setInteractionMode("dimension_select");
            expect(useAppStore.getState().interactionMode).toBe(
                "dimension_select"
            );
        });

        it("should select image", () => {
            useAppStore.getState().setSelectedImageId("img1");
            expect(useAppStore.getState().selectedImageId).toBe("img1");
            expect(useAppStore.getState().selectedDimensionLineId).toBeNull();
        });

        it("should select dimension line", () => {
            useAppStore.getState().setSelectedDimensionLineId("line1");
            expect(useAppStore.getState().selectedDimensionLineId).toBe("line1");
            expect(useAppStore.getState().selectedImageId).toBeNull();
        });

        it("should deselect all", () => {
            useAppStore.getState().setSelectedImageId("img1");
            useAppStore.getState().clearSelection();
            expect(useAppStore.getState().selectedImageId).toBeNull();
            expect(useAppStore.getState().selectedDimensionLineId).toBeNull();
        });
    });

    describe("ViewSlice", () => {
        it("should update canvas state", () => {
            const newCanvas = { x: 10, y: 20, scale: 2 };
            useAppStore.getState().setCanvasState(newCanvas);
            expect(useAppStore.getState().canvas).toEqual(newCanvas);
        });

        it("should reset view", () => {
            useAppStore.getState().setCanvasState({ x: 10, y: 20, scale: 2 });
            useAppStore.getState().setUIHidden(true);
            useAppStore.getState().setAlwaysOnTopMode(true);
            useAppStore.getState().setClickThroughMode(true);

            useAppStore.getState().resetView();

            expect(useAppStore.getState().canvas).toEqual({ x: 0, y: 0, scale: 1 });
            expect(useAppStore.getState().isUIHidden).toBe(false);
            expect(useAppStore.getState().isAlwaysOnTopMode).toBe(false);
            expect(useAppStore.getState().isClickThroughMode).toBe(false);
        });

        it("should toggle UI hidden state", () => {
            expect(useAppStore.getState().isUIHidden).toBe(false);
            useAppStore.getState().setUIHidden(true);
            expect(useAppStore.getState().isUIHidden).toBe(true);
            useAppStore.getState().setUIHidden(false);
            expect(useAppStore.getState().isUIHidden).toBe(false);
        });

        it("should not enable click-through when always-on-top is off", () => {
            useAppStore.getState().setAlwaysOnTopMode(false);
            useAppStore.getState().setClickThroughMode(true);

            expect(useAppStore.getState().isClickThroughMode).toBe(false);
        });

        it("should disable click-through when always-on-top turns off", () => {
            useAppStore.getState().setAlwaysOnTopMode(true);
            useAppStore.getState().setClickThroughMode(true);
            expect(useAppStore.getState().isClickThroughMode).toBe(true);

            useAppStore.getState().setAlwaysOnTopMode(false);

            expect(useAppStore.getState().isAlwaysOnTopMode).toBe(false);
            expect(useAppStore.getState().isClickThroughMode).toBe(false);
        });
    });

    describe("Combined Reset", () => {
        it("should reset all slices", () => {
            useAppStore.getState().setUnitFactor(2.0);
            useAppStore.getState().setInteractionMode("dimension_select");
            useAppStore.getState().setCurrentProjectFilePath("C:/tmp/test.iot");
            useAppStore.getState().resetAll();

            const state = useAppStore.getState();
            expect(state.unitFactor).toBe(1.0);
            expect(state.interactionMode).toBe("default");
            expect(state.currentProjectFilePath).toBeNull();
        });
    });

    describe("Temporal History", () => {
        const createHistorySample = (id: string, path: string): ImageSet => ({
            id,
            path,
            sourceType: "file",
            transparency: 0,
            rotation: 0,
            initAnchorPos: null,
            currentAnchorPos: null,
            locked: false,
        });

        it("should not push undo history for sync actions", () => {
            useAppStore.temporal.getState().clear();

            const baseHistoryLength =
                useAppStore.temporal.getState().pastStates.length;

            useAppStore
                .getState()
                .syncImageSets([createHistorySample("remote-1", "remote.png")]);
            useAppStore.getState().syncUnitFactor(2.5);
            useAppStore.getState().syncUnit("nm");

            expect(useAppStore.temporal.getState().pastStates.length).toBe(
                baseHistoryLength
            );
        });

        it("should clear undo and redo history after loadProject", () => {
            useAppStore
                .getState()
                .setImageSets([createHistorySample("local-1", "local-a.png")]);
            useAppStore
                .getState()
                .setImageSets([createHistorySample("local-2", "local-b.png")]);
            useAppStore.temporal.getState().undo();

            expect(useAppStore.temporal.getState().pastStates.length).toBeGreaterThan(
                0
            );
            expect(
                useAppStore.temporal.getState().futureStates.length
            ).toBeGreaterThan(0);

            useAppStore.getState().loadProject({
                version: "1.0.0",
                window: {
                    width: 800,
                    height: 600,
                    x: 0,
                    y: 0,
                    color: "#123456",
                },
                settings: { unitFactor: 1.2, unit: "um" },
                canvas: { x: 10, y: 20, scale: 1.5 },
                images: [createHistorySample("loaded-1", "loaded.png")],
                dimensionLines: [],
            });

            expect(useAppStore.temporal.getState().pastStates.length).toBe(0);
            expect(useAppStore.temporal.getState().futureStates.length).toBe(0);
        });

        it("should set dirty true when undoing after save", () => {
            useAppStore.temporal.getState().clear();
            useAppStore
                .getState()
                .setImageSets([createHistorySample("local-1", "local-a.png")]);
            useAppStore
                .getState()
                .setImageSets([createHistorySample("local-2", "local-b.png")]);

            useAppStore.getState().markProjectSaved();
            expect(useAppStore.getState().hasUnsavedChanges).toBe(false);

            useAppStore.temporal.getState().undo();
            expect(useAppStore.getState().hasUnsavedChanges).toBe(true);
            expect(useAppStore.getState().imageSets[0].id).toBe("local-1");

            useAppStore.temporal.getState().redo();
            expect(useAppStore.getState().hasUnsavedChanges).toBe(false);
            expect(useAppStore.getState().imageSets[0].id).toBe("local-2");
        });
    });
    describe("loadProjectData", () => {
        it("should load partial project data into store", () => {
            const sampleImageSet: ImageSet = {
                id: "img1",
                path: "path/to/img1.png",
                sourceType: "file",
                transparency: 0.8,
                rotation: 0,
                initAnchorPos: null,
                currentAnchorPos: null,
            };

            const projectData = {
                version: "1.0.0",
                window: { width: 800, height: 600, x: 0, y: 0, color: "#123456" },
                settings: { unitFactor: 1.5, unit: "um" as const },
                images: [sampleImageSet],
                dimensionLines: [
                    {
                        id: "line1",
                        start: { x: 0, y: 0 },
                        end: { x: 10, y: 10 },
                    },
                ],
            };

            useAppStore.getState().loadProjectData(projectData);

            const state = useAppStore.getState();
            expect(state.unitFactor).toBe(1.5);
            expect(state.windowColor).toBe("#123456");
            expect(state.imageSets).toEqual([sampleImageSet]);
            expect(state.dimensionLines).toHaveLength(1);
        });

        it("should load project data with sourceType/dimensionLines/unit fallbacks", () => {
            const projectData = {
                version: "1.0.0",
                window: { width: 800, height: 600, x: 0, y: 0, color: "#123456" },
                settings: { unitFactor: 1.5, unit: undefined },
                images: [
                    {
                        id: "img1",
                        path: "path/to/img1.png",
                        transparency: 0.8,
                        rotation: 0,
                        initAnchorPos: null,
                        currentAnchorPos: null,
                    },
                ],
                dimensionLines: undefined,
            } as unknown as ProjectFile<ImageSet>;

            useAppStore.getState().loadProjectData(projectData);

            const state = useAppStore.getState();
            expect(state.imageSets[0]?.sourceType).toBe("file");
            expect(state.dimensionLines).toEqual([]);
            expect(state.unit).toBe("um");
        });

        it("should reset project data", () => {
            useAppStore.getState().setUnitFactor(5.0);
            useAppStore.getState().resetProjectData();

            expect(useAppStore.getState().unitFactor).toBe(1.0);
            expect(useAppStore.getState().imageSets).toHaveLength(1);
        });
    });
});

