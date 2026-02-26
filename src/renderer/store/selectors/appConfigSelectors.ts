import type { AppState } from "../useAppStore";

export const selectWindowColorPresets = (state: AppState) =>
    state.windowColorPresets;
export const selectSetWindowColorPresets = (state: AppState) =>
    state.setWindowColorPresets;
export const selectIsWindowFrameVisible = (state: AppState) =>
    state.isWindowFrameVisible;
export const selectSetWindowFrameVisible = (state: AppState) =>
    state.setWindowFrameVisible;
