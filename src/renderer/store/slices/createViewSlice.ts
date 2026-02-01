import { StateCreator } from "zustand";

export interface ViewSlice {
    canvas: {
        x: number;
        y: number;
        scale: number;
    };

    setCanvasState: (canvas: { x: number; y: number; scale: number }) => void;

    isUIHidden: boolean;
    setUIHidden: (hidden: boolean) => void;

    resetView: () => void;
}

export const createViewSlice: StateCreator<ViewSlice> = (set) => ({
    canvas: { x: 0, y: 0, scale: 1 },

    setCanvasState: (canvas) => set({ canvas }),

    isUIHidden: false,
    setUIHidden: (hidden) => set({ isUIHidden: hidden }),

    resetView: () =>
        set({ canvas: { x: 0, y: 0, scale: 1 }, isUIHidden: false }),
});
