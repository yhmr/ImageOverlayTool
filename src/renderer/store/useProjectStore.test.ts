// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { act } from "@testing-library/react";
import { useProjectStore } from "./useProjectStore";

// Mock electronAPI
const updateUnitFactorMock = vi.fn();
window.electronAPI = {
  ...window.electronAPI,
  updateUnitFactor: updateUnitFactorMock,
} as any;

describe("useProjectStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useProjectStore.setState(useProjectStore.getInitialState());
  });

  it("should have correct initial state", () => {
    const state = useProjectStore.getState();
    expect(state.unit_factor).toBe(1.0);
    expect(state.windowColor).toBe("#00000000");
    expect(state.canvas).toEqual({ x: 0, y: 0, scale: 1 });
    expect(state.dimensionLines).toEqual([]);
  });

  describe("setUnitFactor", () => {
    it("should update unit_factor and call IPC", () => {
      const { setUnitFactor } = useProjectStore.getState();
      act(() => {
        setUnitFactor(2.5);
      });
      const state = useProjectStore.getState();
      expect(state.unit_factor).toBe(2.5);
      expect(updateUnitFactorMock).toHaveBeenCalledWith(2.5);
    });
  });

  describe("syncUnitFactor", () => {
    it("should update unit_factor but NOT call IPC", () => {
      const { syncUnitFactor } = useProjectStore.getState();
      act(() => {
        syncUnitFactor(3.0);
      });
      const state = useProjectStore.getState();
      expect(state.unit_factor).toBe(3.0);
      expect(updateUnitFactorMock).not.toHaveBeenCalled();
    });
  });

  describe("setWindowColor", () => {
    it("should update windowColor", () => {
      const { setWindowColor } = useProjectStore.getState();
      act(() => {
        setWindowColor("#ff0000");
      });
      expect(useProjectStore.getState().windowColor).toBe("#ff0000");
    });
  });

  describe("setCanvasState", () => {
    it("should update canvas state", () => {
      const { setCanvasState } = useProjectStore.getState();
      const newCanvas = { x: 10, y: 20, scale: 1.5 };
      act(() => {
        setCanvasState(newCanvas);
      });
      expect(useProjectStore.getState().canvas).toEqual(newCanvas);
    });
  });

  describe("Dimension Lines actions", () => {
    const sampleLine = {
      id: "1",
      start: { x: 0, y: 0 },
      end: { x: 10, y: 10 },
      text: "10mm",
    };

    it("should add a dimension line", () => {
      const { addDimensionLine } = useProjectStore.getState();
      act(() => {
        addDimensionLine(sampleLine);
      });
      expect(useProjectStore.getState().dimensionLines).toContainEqual(
        sampleLine
      );
    });

    it("should update a dimension line", () => {
      const { addDimensionLine, updateDimensionLine } =
        useProjectStore.getState();
      act(() => {
        addDimensionLine(sampleLine);
      });

      const updatedLine = { ...sampleLine, end: { x: 20, y: 20 } };
      act(() => {
        updateDimensionLine(updatedLine);
      });

      expect(useProjectStore.getState().dimensionLines).toContainEqual(
        updatedLine
      );
      expect(useProjectStore.getState().dimensionLines.length).toBe(1);
    });

    it("should remove a dimension line", () => {
      const { addDimensionLine, removeDimensionLine } =
        useProjectStore.getState();
      act(() => {
        addDimensionLine(sampleLine);
      });
      act(() => {
        removeDimensionLine(sampleLine.id);
      });
      expect(useProjectStore.getState().dimensionLines).toEqual([]);
    });

    it("should set multiple dimension lines", () => {
      const { setDimensionLines } = useProjectStore.getState();
      const lines = [sampleLine, { ...sampleLine, id: "2" }];
      act(() => {
        setDimensionLines(lines);
      });
      expect(useProjectStore.getState().dimensionLines).toEqual(lines);
    });
  });
});
