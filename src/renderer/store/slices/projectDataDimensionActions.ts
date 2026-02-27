import type {
    ProjectDataSlice,
    SetProjectDataWithOrigin,
} from "./projectDataSliceTypes";

interface CreateProjectDataDimensionActionsParams {
    setProjectDataWithOrigin: SetProjectDataWithOrigin;
}

export const createProjectDataDimensionActions = ({
    setProjectDataWithOrigin,
}: CreateProjectDataDimensionActionsParams): Pick<
    ProjectDataSlice,
    | "setDimensionLines"
    | "receiveDimensionLines"
    | "addDimensionLine"
    | "updateDimensionLine"
    | "removeDimensionLine"
> => ({
    setDimensionLines: (lines) =>
        setProjectDataWithOrigin("local", {
            dimensionLines: lines,
            hasUnsavedChanges: true,
        }),

    receiveDimensionLines: (lines) =>
        setProjectDataWithOrigin("remote", {
            dimensionLines: lines,
            hasUnsavedChanges: true,
        }),

    addDimensionLine: (line) =>
        setProjectDataWithOrigin("local", (state) => ({
            dimensionLines: [...state.dimensionLines, line],
            hasUnsavedChanges: true,
        })),

    updateDimensionLine: (line) =>
        setProjectDataWithOrigin("local", (state) => {
            const index = state.dimensionLines.findIndex(
                (l) => l.id === line.id
            );
            if (index !== -1) {
                const newLines = [...state.dimensionLines];
                newLines[index] = line;
                return {
                    dimensionLines: newLines,
                    hasUnsavedChanges: true,
                };
            }
            return null;
        }),

    removeDimensionLine: (id) =>
        setProjectDataWithOrigin("local", (state) => ({
            dimensionLines: state.dimensionLines.filter((l) => l.id !== id),
            hasUnsavedChanges: true,
        })),
});
