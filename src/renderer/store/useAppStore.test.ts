/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { useAppStore } from "./useAppStore";
import { ImageSet } from "../types/ImageSet";
import { DimensionLine } from "../../shared/types/DimensionLine";

// Mock electronAPI
const mockUpdateImageSets = vi.fn();
const mockUpdateUnitFactor = vi.fn();

window.electronAPI = {
  updateImageSets: mockUpdateImageSets,
  updateUnitFactor: mockUpdateUnitFactor,
  // ... other mocks if needed
} as any;

describe("useAppStore", () => {
  beforeEach(() => {
    useAppStore.getState().resetAll();
    vi.clearAllMocks();
  });

  describe("ProjectDataSlice", () => {
    const sampleImageSet: ImageSet = {
      id: "img1",
      path: "/path/to/image.png",
      transparency: 0,
      rotation: 0,
      init_anchor_pos: null,
      current_anchor_pos: null,
    };

    it("should initialize with default values", () => {
      const state = useAppStore.getState();
      expect(state.imageSets).toHaveLength(1);
      expect(state.unitFactor).toBe(1.0);
      expect(state.windowColor).toBe("#00000000");
    });

    describe("ImageSets Actions", () => {
      it("should set image sets and call IPC", () => {
        const newSets = [sampleImageSet];
        useAppStore.getState().setImageSets(newSets);

        const state = useAppStore.getState();
        expect(state.imageSets).toEqual(newSets);
        expect(mockUpdateImageSets).toHaveBeenCalledWith(newSets);
      });

      it("should sync image sets WITHOUT calling IPC", () => {
        const newSets = [sampleImageSet];
        useAppStore.getState().syncImageSets(newSets);

        const state = useAppStore.getState();
        expect(state.imageSets).toEqual(newSets);
        expect(mockUpdateImageSets).not.toHaveBeenCalled();
      });

      it("should update image set by index and call IPC", () => {
        useAppStore.getState().setImageSets([sampleImageSet]);
        mockUpdateImageSets.mockClear();

        const updatedSet = { ...sampleImageSet, transparency: 0.5 };
        useAppStore
          .getState()
          .updateImageSet({ index: 0, imageSet: updatedSet });

        const state = useAppStore.getState();
        expect(state.imageSets[0]).toEqual(updatedSet);
        expect(mockUpdateImageSets).toHaveBeenCalledWith([updatedSet]);
      });

      it("should update image set by ID and call IPC", () => {
        useAppStore.getState().setImageSets([sampleImageSet]);
        mockUpdateImageSets.mockClear();

        const updatedSet = { ...sampleImageSet, rotation: 90 };
        useAppStore
          .getState()
          .updateImageSet({ id: "img1", imageSet: updatedSet });

        const state = useAppStore.getState();
        expect(state.imageSets[0]).toEqual(updatedSet);
        expect(mockUpdateImageSets).toHaveBeenCalledWith([updatedSet]);
      });
    });

    describe("UnitFactor Actions", () => {
      it("should update unit factor and call IPC", () => {
        useAppStore.getState().setUnitFactor(2.5);
        expect(useAppStore.getState().unitFactor).toBe(2.5);
        expect(mockUpdateUnitFactor).toHaveBeenCalledWith(2.5);
      });

      it("should sync unit factor WITHOUT calling IPC", () => {
        useAppStore.getState().syncUnitFactor(3.0);
        expect(useAppStore.getState().unitFactor).toBe(3.0);
        expect(mockUpdateUnitFactor).not.toHaveBeenCalled();
      });
    });

    describe("WindowColor Actions", () => {
      it("should update windowColor", () => {
        useAppStore.getState().setWindowColor("#ff0000");
        expect(useAppStore.getState().windowColor).toBe("#ff0000");
      });
    });

    describe("Dimension Lines Actions", () => {
      const sampleLine: DimensionLine = {
        id: "1",
        start: { x: 0, y: 0 },
        end: { x: 10, y: 10 },
      };

      it("should add a dimension line", () => {
        useAppStore.getState().addDimensionLine(sampleLine);
        expect(useAppStore.getState().dimensionLines).toContainEqual(
          sampleLine
        );
      });

      it("should update a dimension line", () => {
        useAppStore.getState().addDimensionLine(sampleLine);
        const updatedLine = { ...sampleLine, end: { x: 20, y: 20 } };
        useAppStore.getState().updateDimensionLine(updatedLine);
        expect(useAppStore.getState().dimensionLines).toContainEqual(
          updatedLine
        );
        expect(useAppStore.getState().dimensionLines).toHaveLength(1);
      });

      it("should remove a dimension line", () => {
        useAppStore.getState().addDimensionLine(sampleLine);
        useAppStore.getState().removeDimensionLine(sampleLine.id);
        expect(useAppStore.getState().dimensionLines).toEqual([]);
      });

      it("should set multiple dimension lines", () => {
        const lines = [sampleLine, { ...sampleLine, id: "2" }];
        useAppStore.getState().setDimensionLines(lines);
        expect(useAppStore.getState().dimensionLines).toEqual(lines);
      });
    });

    describe("Bulk Actions", () => {
      it("should load project data", () => {
        const projectData = {
          version: "1.0.0",
          window: {
            width: 800,
            height: 600,
            x: 0,
            y: 0,
            color: "#123456",
          },
          settings: { unitFactor: 1.5 },
          images: [sampleImageSet],
          dimensionLines: [
            {
              id: "l1",
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

        // Check if IPC was called (optional but good for consistency)
        expect(mockUpdateImageSets).toHaveBeenCalledWith([sampleImageSet]);
        expect(mockUpdateUnitFactor).toHaveBeenCalledWith(1.5);
      });

      it("should reset project data", () => {
        useAppStore.getState().setUnitFactor(5);
        useAppStore.getState().resetProjectData();
        const state = useAppStore.getState();
        expect(state.unitFactor).toBe(1.0);
        expect(state.imageSets).toHaveLength(1);
        expect(state.imageSets[0].path).toBe("");
      });
    });
  });

  describe("ViewSlice", () => {
    it("should update canvas state", () => {
      const newCanvas = { x: 100, y: 200, scale: 2 };
      useAppStore.getState().setCanvasState(newCanvas);
      expect(useAppStore.getState().canvas).toEqual(newCanvas);
    });

    it("should reset view", () => {
      useAppStore.getState().setCanvasState({ x: 100, y: 100, scale: 2 });
      useAppStore.getState().resetView();
      expect(useAppStore.getState().canvas).toEqual({
        x: 0,
        y: 0,
        scale: 1,
      });
    });
  });

  describe("InteractionSlice", () => {
    it("should change interaction mode", () => {
      useAppStore.getState().setInteractionMode("dimension");
      expect(useAppStore.getState().interactionMode).toBe("dimension");
    });

    it("should select image", () => {
      useAppStore.getState().selectImage("test-id");
      expect(useAppStore.getState().selectedImageId).toBe("test-id");
      expect(useAppStore.getState().selectedDimensionLineId).toBeNull();
    });

    it("should select dimension line", () => {
      useAppStore.getState().selectDimensionLine("line-id");
      expect(useAppStore.getState().selectedDimensionLineId).toBe("line-id");
      expect(useAppStore.getState().selectedImageId).toBeNull();
    });

    it("should deselect all", () => {
      useAppStore.getState().selectImage("test-id");
      useAppStore.getState().deselectAll();
      expect(useAppStore.getState().selectedImageId).toBeNull();
      expect(useAppStore.getState().selectedDimensionLineId).toBeNull();
    });
  });

  describe("Combined Reset", () => {
    it("should reset all slices", () => {
      useAppStore.getState().setUnitFactor(5);
      useAppStore.getState().setCanvasState({ x: 10, y: 10, scale: 2 });
      useAppStore.getState().setInteractionMode("dimension");

      useAppStore.getState().resetAll();

      const state = useAppStore.getState();
      expect(state.unitFactor).toBe(1.0);
      expect(state.canvas).toEqual({ x: 0, y: 0, scale: 1 });
      expect(state.interactionMode).toBe("default");
    });
  });
});
