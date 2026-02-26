import { StateCreator } from "zustand";

import { DimensionLine } from "../../../shared/types/DimensionLine";
import { ImageSet } from "../../../shared/types/ImageSet";
import { ProjectFile } from "../../../shared/types/ProjectFile";
import {
    sanitizeUnitFactor,
    UNIT_FACTOR_DEFAULT,
} from "../../../shared/constants/unitFactor";
import {
    createEmptyImageSet,
    createImageSetFromLocalFile,
} from "../../factories/imageSetFactory";
import {
    runAsSystemMutation,
    type TemporalStoreAccessor,
} from "../temporalHistory";
import type {
    ProjectDataChangeOrigin,
    SyncOriginSlice,
} from "./createSyncOriginSlice";

export interface ProjectDataSlice {
    // Data State
    imageSets: ImageSet[];
    dimensionLines: DimensionLine[];
    unitFactor: number;
    unit: "nm" | "um" | "mm";
    windowColor: string;
    hasUnsavedChanges: boolean;

    // Actions
    markProjectSaved: () => void;
    replaceImageSetsAfterSave: (imageSets: ImageSet[]) => void;

    setImageSets: (imageSets: ImageSet[]) => void;
    addImageSetWithPath: (
        path: string,
        options?: { sourceType?: ImageSet["sourceType"] }
    ) => void;
    updateImageSet: (payload: {
        index?: number;
        id?: string;
        imageSet: ImageSet;
    }) => void;
    syncImageSets: (imageSets: ImageSet[]) => void;
    receiveImageSets: (imageSets: ImageSet[]) => void;

    setDimensionLines: (lines: DimensionLine[]) => void;
    receiveDimensionLines: (lines: DimensionLine[]) => void;
    addDimensionLine: (line: DimensionLine) => void;
    updateDimensionLine: (line: DimensionLine) => void;
    removeDimensionLine: (id: string) => void;

    setUnitFactor: (factor: number) => void;
    syncUnitFactor: (factor: number) => void;

    setUnit: (unit: "nm" | "um" | "mm") => void;
    syncUnit: (unit: "nm" | "um" | "mm") => void;

    setWindowColor: (color: string) => void;

    loadProjectData: (project: ProjectFile<ImageSet>) => void;
    resetProjectData: () => void;
}

type ProjectDataStoreState = ProjectDataSlice & SyncOriginSlice;
type ProjectDataMutableFields = Pick<
    ProjectDataStoreState,
    | "imageSets"
    | "dimensionLines"
    | "unitFactor"
    | "unit"
    | "windowColor"
    | "hasUnsavedChanges"
>;
type ProjectDataPatch = Partial<ProjectDataMutableFields>;

/**
 * ProjectDataSliceを作成するファクトリー関数
 * @param getTemporal zundoのtemporal stateを取得する関数
 */
export const createProjectDataSlice = (
    getTemporal: TemporalStoreAccessor
): StateCreator<ProjectDataStoreState, [], [], ProjectDataSlice> => {
    return (set) => {
        const setProjectDataWithOrigin = (
            origin: ProjectDataChangeOrigin,
            patch:
                | ProjectDataPatch
                | ((state: ProjectDataStoreState) => ProjectDataPatch | null)
        ) => {
            if (typeof patch === "function") {
                set((state) => {
                    const result = patch(state);
                    if (!result) {
                        return state;
                    }
                    return {
                        ...result,
                        projectDataChangeOrigin: origin,
                    };
                });
                return;
            }

            set({
                ...patch,
                projectDataChangeOrigin: origin,
            });
        };

        return {
            imageSets: [createEmptyImageSet()],
            dimensionLines: [],
            unitFactor: UNIT_FACTOR_DEFAULT,
            unit: "um",
            windowColor: "#00000000",
            hasUnsavedChanges: false,

            markProjectSaved: () => {
                runAsSystemMutation(getTemporal, () => {
                    set({ hasUnsavedChanges: false });
                });
            },

            replaceImageSetsAfterSave: (imageSets) => {
                runAsSystemMutation(getTemporal, () => {
                    setProjectDataWithOrigin("local", {
                        imageSets,
                        hasUnsavedChanges: false,
                    });
                });
            },

            // --- Image Sets ---
            setImageSets: (imageSets) => {
                setProjectDataWithOrigin("local", {
                    imageSets,
                    hasUnsavedChanges: true,
                });
            },

            addImageSetWithPath: (path, options) => {
                if (!path) {
                    return;
                }

                setProjectDataWithOrigin("local", (state) => {
                    const nextImageSet = createImageSetFromLocalFile(path, {
                        sourceType: options?.sourceType ?? "file",
                    });
                    const nextImageSets = [...state.imageSets];

                    if (nextImageSets.length === 1 && !nextImageSets[0].path) {
                        nextImageSets[0] = nextImageSet;
                    } else {
                        nextImageSets.push(nextImageSet);
                    }

                    return {
                        imageSets: nextImageSets,
                        hasUnsavedChanges: true,
                    };
                });
            },

            updateImageSet: (payload) => {
                setProjectDataWithOrigin("local", (state) => {
                    const newImageSets = [...state.imageSets];
                    if (payload.index !== undefined) {
                        if (newImageSets.length > payload.index) {
                            newImageSets[payload.index] = payload.imageSet;
                        }
                    } else if (payload.id !== undefined) {
                        const targetIndex = newImageSets.findIndex(
                            (s) => s.id === payload.id
                        );
                        if (targetIndex >= 0) {
                            newImageSets[targetIndex] = payload.imageSet;
                        }
                    }
                    return {
                        imageSets: newImageSets,
                        hasUnsavedChanges: true,
                    };
                });
            },

            syncImageSets: (imageSets) => {
                runAsSystemMutation(getTemporal, () => {
                    setProjectDataWithOrigin("remote", {
                        imageSets,
                        hasUnsavedChanges: true,
                    });
                });
            },

            receiveImageSets: (imageSets) => {
                setProjectDataWithOrigin("remote", {
                    imageSets,
                    hasUnsavedChanges: true,
                });
            },

            // --- Dimension Lines ---
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
                    dimensionLines: state.dimensionLines.filter(
                        (l) => l.id !== id
                    ),
                    hasUnsavedChanges: true,
                })),

            // --- Settings ---
            setUnitFactor: (factor) => {
                setProjectDataWithOrigin("local", {
                    unitFactor: sanitizeUnitFactor(factor),
                    hasUnsavedChanges: true,
                });
            },

            syncUnitFactor: (factor) => {
                runAsSystemMutation(getTemporal, () => {
                    setProjectDataWithOrigin("remote", {
                        unitFactor: sanitizeUnitFactor(factor),
                        hasUnsavedChanges: true,
                    });
                });
            },

            setUnit: (unit) => {
                setProjectDataWithOrigin("local", {
                    unit,
                    hasUnsavedChanges: true,
                });
            },

            syncUnit: (unit) => {
                runAsSystemMutation(getTemporal, () => {
                    setProjectDataWithOrigin("remote", {
                        unit,
                        hasUnsavedChanges: true,
                    });
                });
            },

            setWindowColor: (color) => {
                setProjectDataWithOrigin("local", {
                    windowColor: color,
                    hasUnsavedChanges: true,
                });
            },

            // --- Bulk Actions ---
            loadProjectData: (project) => {
                const newImageSets = project.images.map((imageSet) => ({
                    ...imageSet,
                    sourceType: imageSet.sourceType ?? "file",
                }));
                const newDimensionLines = project.dimensionLines || [];
                const newUnitFactor = sanitizeUnitFactor(
                    project.settings.unitFactor
                );
                const newUnit = project.settings.unit || "um";
                const newWindowColor = project.window.color;

                setProjectDataWithOrigin("local", {
                    imageSets: newImageSets,
                    dimensionLines: newDimensionLines,
                    unitFactor: newUnitFactor,
                    unit: newUnit,
                    windowColor: newWindowColor,
                    hasUnsavedChanges: false,
                });
            },

            resetProjectData: () => {
                const defaultImageSets = [createEmptyImageSet()];
                // windowColorは意図的に保持する（ユーザーの背景色設定を維持）
                setProjectDataWithOrigin("local", {
                    imageSets: defaultImageSets,
                    dimensionLines: [],
                    unitFactor: UNIT_FACTOR_DEFAULT,
                    unit: "um",
                    hasUnsavedChanges: false,
                });
            },
        };
    };
};
