import { create } from "zustand";
import { DimensionLine } from "../../shared/types/DimensionLine";

interface ProjectState {
  unit_factor: number;
  windowColor: string;
  canvas: {
    x: number;
    y: number;
    scale: number;
  };
  dimensionLines: DimensionLine[];

  // Actions
  setUnitFactor: (factor: number) => void;
  syncUnitFactor: (factor: number) => void;
  setWindowColor: (color: string) => void;
  setCanvasState: (canvas: { x: number; y: number; scale: number }) => void;
  resetProject: () => void;
  addDimensionLine: (line: DimensionLine) => void;
  updateDimensionLine: (line: DimensionLine) => void;
  removeDimensionLine: (id: string) => void;
  setDimensionLines: (lines: DimensionLine[]) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  unit_factor: 1,
  windowColor: "#00000000",
  canvas: { x: 0, y: 0, scale: 1 },
  dimensionLines: [],

  setUnitFactor: (factor) => {
    set({ unit_factor: factor });
    window.electronAPI.updateUnitFactor(factor); // Sync with Main
  },
  syncUnitFactor: (factor) => {
    set({ unit_factor: factor });
  },
  setWindowColor: (color) => {
    set({ windowColor: color });
  },
  setCanvasState: (canvas) => {
    set({ canvas });
  },
  resetProject: () => {
    set({
      unit_factor: 1,
      canvas: { x: 0, y: 0, scale: 1 },
      dimensionLines: [],
    });
  },
  addDimensionLine: (line) => {
    set((state) => ({ dimensionLines: [...state.dimensionLines, line] }));
  },
  updateDimensionLine: (line) => {
    set((state) => {
      const index = state.dimensionLines.findIndex((l) => l.id === line.id);
      if (index !== -1) {
        const newLines = [...state.dimensionLines];
        newLines[index] = line;
        return { dimensionLines: newLines };
      }
      return state;
    });
  },
  removeDimensionLine: (id) => {
    set((state) => ({
      dimensionLines: state.dimensionLines.filter((l) => l.id !== id),
    }));
  },
  setDimensionLines: (lines) => {
    set({ dimensionLines: lines });
  },
}));
