import type { AppState } from "../useAppStore";

export const selectImageSets = (state: AppState) => state.imageSets;
export const selectSetImageSets = (state: AppState) => state.setImageSets;
export const selectAddImageSetWithPath = (state: AppState) =>
    state.addImageSetWithPath;

export const selectDimensionLines = (state: AppState) => state.dimensionLines;
export const selectAddDimensionLine = (state: AppState) =>
    state.addDimensionLine;
export const selectUpdateDimensionLine = (state: AppState) =>
    state.updateDimensionLine;
export const selectRemoveDimensionLine = (state: AppState) =>
    state.removeDimensionLine;

export const selectUnitFactor = (state: AppState) => state.unitFactor;
export const selectUnit = (state: AppState) => state.unit;
export const selectHasUnsavedChanges = (state: AppState) =>
    state.hasUnsavedChanges;

export const selectMarkProjectSaved = (state: AppState) =>
    state.markProjectSaved;
export const selectReplaceImageSetsAfterSave = (state: AppState) =>
    state.replaceImageSetsAfterSave;
