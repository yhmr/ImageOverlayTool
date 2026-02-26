import type { AppState } from "../useAppStore";

export const selectCurrentProjectFilePath = (state: AppState) =>
    state.currentProjectFilePath;
export const selectSetCurrentProjectFilePath = (state: AppState) =>
    state.setCurrentProjectFilePath;
export const selectLoadProject = (state: AppState) => state.loadProject;
export const selectResetAll = (state: AppState) => state.resetAll;
