/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, beforeEach } from "vitest";
import { useAppStore } from "@/renderer/store/useAppStore";
import { ImageSet } from "@/shared/types/ImageSet";
import { DimensionLine } from "@/shared/types/DimensionLine";

describe("useAppStore", () => {
    beforeEach(() => {
        useAppStore.getState().resetAll();
    });

    describe("ProjectDataSlice", () => {
        const sampleImageSet: ImageSet = {
            id: "img1",
            path: "path/to/img1.png",
            transparency: 0.8,
            rotation: 0,
            init_anchor_pos: null,
            current_anchor_pos: null,
        };

        describe("Image Sets Actions", () => {
            it("should set image sets", () => {
                const newSets = [sampleImageSet];
                useAppStore.getState().setImageSets(newSets);

                const state = useAppStore.getState();
                expect(state.imageSets).toEqual(newSets);
                expect(state.projectDataChangeOrigin).toBe("local");
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
        });
    });

    describe("InteractionSlice", () => {
        it("should change interaction mode", () => {
            useAppStore.getState().setInteractionMode("dimension");
            expect(useAppStore.getState().interactionMode).toBe("dimension");
        });

        it("should select image", () => {
            useAppStore.getState().selectImage("img1");
            expect(useAppStore.getState().selectedImageId).toBe("img1");
            expect(useAppStore.getState().selectedDimensionLineId).toBeNull();
        });

        it("should select dimension line", () => {
            useAppStore.getState().selectDimensionLine("line1");
            expect(useAppStore.getState().selectedDimensionLineId).toBe("line1");
            expect(useAppStore.getState().selectedImageId).toBeNull();
        });

        it("should deselect all", () => {
            useAppStore.getState().selectImage("img1");
            useAppStore.getState().deselectAll();
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

            useAppStore.getState().resetView();

            expect(useAppStore.getState().canvas).toEqual({ x: 0, y: 0, scale: 1 });
            expect(useAppStore.getState().isUIHidden).toBe(false);
        });

        it("should toggle UI hidden state", () => {
            expect(useAppStore.getState().isUIHidden).toBe(false);
            useAppStore.getState().setUIHidden(true);
            expect(useAppStore.getState().isUIHidden).toBe(true);
            useAppStore.getState().setUIHidden(false);
            expect(useAppStore.getState().isUIHidden).toBe(false);
        });
    });

    describe("Combined Reset", () => {
        it("should reset all slices", () => {
            useAppStore.getState().setUnitFactor(2.0);
            useAppStore.getState().setInteractionMode("dimension");
            useAppStore.getState().setCurrentProjectFilePath("C:/tmp/test.iot");
            useAppStore.getState().resetAll();

            const state = useAppStore.getState();
            expect(state.unitFactor).toBe(1.0);
            expect(state.interactionMode).toBe("default");
            expect(state.currentProjectFilePath).toBeNull();
        });
    });

    describe("loadProjectData", () => {
        it("should load partial project data into store", () => {
            const sampleImageSet: ImageSet = {
                id: "img1",
                path: "path/to/img1.png",
                transparency: 0.8,
                rotation: 0,
                init_anchor_pos: null,
                current_anchor_pos: null,
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

        it("should reset project data", () => {
            useAppStore.getState().setUnitFactor(5.0);
            useAppStore.getState().resetProjectData();

            expect(useAppStore.getState().unitFactor).toBe(1.0);
            expect(useAppStore.getState().imageSets).toHaveLength(1);
        });
    });
});
