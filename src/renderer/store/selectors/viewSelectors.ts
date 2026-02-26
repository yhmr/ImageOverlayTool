import type { AppState } from "../useAppStore";

export const selectCanvas = (state: AppState) => state.canvas;
export const selectSetCanvasState = (state: AppState) => state.setCanvasState;
export const selectIsUIHidden = (state: AppState) => state.isUIHidden;
export const selectSetUIHidden = (state: AppState) => state.setUIHidden;
export const selectIsAlwaysOnTopMode = (state: AppState) =>
    state.isAlwaysOnTopMode;
export const selectSetAlwaysOnTopMode = (state: AppState) =>
    state.setAlwaysOnTopMode;
export const selectIsClickThroughMode = (state: AppState) =>
    state.isClickThroughMode;
export const selectSetClickThroughMode = (state: AppState) =>
    state.setClickThroughMode;
export const selectResetView = (state: AppState) => state.resetView;
