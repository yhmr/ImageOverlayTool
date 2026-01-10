import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ProjectState {
    unit_factor: number;
    windowColor: string;
    canvas: {
        x: number;
        y: number;
        scale: number;
    };
}

const initialState: ProjectState = {
    unit_factor: 1,
    windowColor: "#00000000",
    canvas: { x: 0, y: 0, scale: 1 },
};

export const projectSlice = createSlice({
    name: "project",
    initialState,
    reducers: {
        setUnitFactor: (state, action: PayloadAction<number>) => {
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
            // Keep windowColor
        },
    },
});

export const { setUnitFactor, setWindowColor, setCanvasState, resetProject } = projectSlice.actions;
