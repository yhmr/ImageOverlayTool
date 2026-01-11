import { createSlice, PayloadAction } from "@reduxjs/toolkit";
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
}

const initialState: ProjectState = {
    unit_factor: 1,
    windowColor: "#00000000",
    canvas: { x: 0, y: 0, scale: 1 },
    dimensionLines: [],
};

export const projectSlice = createSlice({
    name: "project",
    initialState,
    reducers: {
        setUnitFactor: (state, action: PayloadAction<number>) => {
            state.unit_factor = action.payload;
        },
        syncUnitFactor: (state, action: PayloadAction<number>) => {
            state.unit_factor = action.payload;
        },
        setWindowColor: (state, action: PayloadAction<string>) => {
            state.windowColor = action.payload;
        },
        setCanvasState: (state, action: PayloadAction<{ x: number; y: number; scale: number }>) => {
            state.canvas = action.payload;
        },
        // Reset project settings (e.g. for New Project)
        resetProject: (state) => {
            state.unit_factor = 1;
            state.canvas = { x: 0, y: 0, scale: 1 };
            state.dimensionLines = [];
            // Keep windowColor
        },
        addDimensionLine: (state, action: PayloadAction<DimensionLine>) => {
            state.dimensionLines.push(action.payload);
        },
        updateDimensionLine: (state, action: PayloadAction<DimensionLine>) => {
            const index = state.dimensionLines.findIndex(l => l.id === action.payload.id);
            if (index !== -1) {
                state.dimensionLines[index] = action.payload;
            }
        },
        removeDimensionLine: (state, action: PayloadAction<string>) => {
            state.dimensionLines = state.dimensionLines.filter(l => l.id !== action.payload);
        },
        setDimensionLines: (state, action: PayloadAction<DimensionLine[]>) => {
            state.dimensionLines = action.payload;
        },
    },
});

export const {
    setUnitFactor,
    syncUnitFactor, // Add this
    setWindowColor,
    setCanvasState,
    resetProject,
    addDimensionLine,
    updateDimensionLine,
    removeDimensionLine,
    setDimensionLines
} = projectSlice.actions;
