import type { AppState } from "../useAppStore";

export const selectProjectDataChangeOrigin = (state: AppState) =>
    state.projectDataChangeOrigin;
export const selectSetProjectDataChangeOrigin = (state: AppState) =>
    state.setProjectDataChangeOrigin;
