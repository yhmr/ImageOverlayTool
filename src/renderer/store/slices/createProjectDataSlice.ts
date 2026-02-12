import { StateCreator } from "zustand";

import { DimensionLine } from "../../../shared/types/DimensionLine";
import { ImageSet } from "../../../shared/types/ImageSet";
import { ProjectFile } from "../../../shared/types/ProjectFile";
import { createEmptyImageSet } from "../../factories/imageSetFactory";
import {
    runAsSystemMutation,
    type TemporalStoreAccessor,
} from "../temporalHistory";

export interface ProjectDataSlice {
    // Data State
    imageSets: ImageSet[];
    dimensionLines: DimensionLine[];
    unitFactor: number;
    unit: "nm" | "um" | "mm";
    windowColor: string;
    projectDataChangeOrigin: "local" | "remote";

    // Actions
    setImageSets: (imageSets: ImageSet[]) => void;
    updateImageSet: (payload: {
        index?: number;
        id?: string;
        imageSet: ImageSet;
    }) => void;
    syncImageSets: (imageSets: ImageSet[]) => void;
    receiveImageSets: (imageSets: ImageSet[]) => void;

    setDimensionLines: (lines: DimensionLine[]) => void;
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

/**
 * ProjectDataSliceを作成するファクトリー関数
 * @param getTemporal zundoのtemporal stateを取得する関数
 */
export const createProjectDataSlice = (
    getTemporal: TemporalStoreAccessor
): StateCreator<ProjectDataSlice> => {
    return (set) => ({
        imageSets: [createEmptyImageSet()],
        dimensionLines: [],
        unitFactor: 1.0,
        unit: "um",
        windowColor: "#00000000",
        projectDataChangeOrigin: "local",

        // --- Image Sets ---
        setImageSets: (imageSets) => {
            set({ imageSets, projectDataChangeOrigin: "local" });
        },

        updateImageSet: (payload) => {
            set((state) => {
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
                    projectDataChangeOrigin: "local",
                };
            });
        },

        syncImageSets: (imageSets) => {
            runAsSystemMutation(getTemporal, () => {
                set({ imageSets, projectDataChangeOrigin: "remote" });
            });
        },

        receiveImageSets: (imageSets) => {
            set({ imageSets, projectDataChangeOrigin: "remote" });
        },

        // --- Dimension Lines ---
        setDimensionLines: (lines) =>
            set({ dimensionLines: lines, projectDataChangeOrigin: "local" }),

        addDimensionLine: (line) =>
            set((state) => ({
                dimensionLines: [...state.dimensionLines, line],
                projectDataChangeOrigin: "local",
            })),

        updateDimensionLine: (line) =>
            set((state) => {
                const index = state.dimensionLines.findIndex(
                    (l) => l.id === line.id
                );
                if (index !== -1) {
                    const newLines = [...state.dimensionLines];
                    newLines[index] = line;
                    return {
                        dimensionLines: newLines,
                        projectDataChangeOrigin: "local",
                    };
                }
                return state;
            }),

        removeDimensionLine: (id) =>
            set((state) => ({
                dimensionLines: state.dimensionLines.filter((l) => l.id !== id),
                projectDataChangeOrigin: "local",
            })),

        // --- Settings ---
        setUnitFactor: (factor) => {
            set({ unitFactor: factor, projectDataChangeOrigin: "local" });
        },

        syncUnitFactor: (factor) => {
            runAsSystemMutation(getTemporal, () => {
                set({ unitFactor: factor, projectDataChangeOrigin: "remote" });
            });
        },

        setUnit: (unit) => {
            set({ unit, projectDataChangeOrigin: "local" });
        },

        syncUnit: (unit) => {
            runAsSystemMutation(getTemporal, () => {
                set({ unit, projectDataChangeOrigin: "remote" });
            });
        },

        setWindowColor: (color) => {
            set({ windowColor: color, projectDataChangeOrigin: "local" });
        },

        // --- Bulk Actions ---
        loadProjectData: (project) => {
            const newImageSets = project.images;
            const newDimensionLines = project.dimensionLines || [];
            const newUnitFactor = project.settings.unitFactor;
            const newUnit = project.settings.unit || "um";
            const newWindowColor = project.window.color;

            set({
                imageSets: newImageSets,
                dimensionLines: newDimensionLines,
                unitFactor: newUnitFactor,
                unit: newUnit,
                windowColor: newWindowColor,
                projectDataChangeOrigin: "local",
            });
        },

        resetProjectData: () => {
            const defaultImageSets = [createEmptyImageSet()];
            // windowColorは意図的に保持する（ユーザーの背景色設定を維持）
            set({
                imageSets: defaultImageSets,
                dimensionLines: [],
                unitFactor: 1.0,
                unit: "um",
                projectDataChangeOrigin: "local",
            });
        },
    });
};
