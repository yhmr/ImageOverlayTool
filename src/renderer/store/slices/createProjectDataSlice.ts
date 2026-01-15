import { StateCreator } from "zustand";
import { ImageSet } from "../../../shared/types/ImageSet";
import { DimensionLine } from "../../../shared/types/DimensionLine";
import { ProjectFile } from "../../../shared/types/ProjectFile";
import UUID from "uuidjs";
import { getIPCService } from "../../services/ipcService";

const createDefaultImageSet = (): ImageSet => ({
    id: UUID.generate(),
    path: "",
    transparency: 0,
    rotation: 0,
    init_anchor_pos: null,
    current_anchor_pos: null,
});

export interface ProjectDataSlice {
    // Data State
    imageSets: ImageSet[];
    dimensionLines: DimensionLine[];
    unitFactor: number;
    windowColor: string;

    // Actions
    setImageSets: (imageSets: ImageSet[]) => void;
    updateImageSet: (payload: {
        index?: number;
        id?: string;
        imageSet: ImageSet;
    }) => void;
    syncImageSets: (imageSets: ImageSet[]) => void;

    setDimensionLines: (lines: DimensionLine[]) => void;
    addDimensionLine: (line: DimensionLine) => void;
    updateDimensionLine: (line: DimensionLine) => void;
    removeDimensionLine: (id: string) => void;

    setUnitFactor: (factor: number) => void;
    syncUnitFactor: (factor: number) => void;

    setWindowColor: (color: string) => void;

    loadProjectData: (project: ProjectFile<ImageSet>) => void;
    resetProjectData: () => void;
}

export const createProjectDataSlice: StateCreator<ProjectDataSlice> = (
    set
) => ({
    imageSets: [createDefaultImageSet()],
    dimensionLines: [],
    unitFactor: 1.0,
    windowColor: "#00000000",

    // --- Image Sets ---
    setImageSets: (imageSets) => {
        set({ imageSets });
        getIPCService().updateImageSets(imageSets);
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
                    (set) => set.id === payload.id
                );
                if (targetIndex >= 0) {
                    newImageSets[targetIndex] = payload.imageSet;
                }
            }
            getIPCService().updateImageSets(newImageSets);
            return { imageSets: newImageSets };
        });
    },

    syncImageSets: (imageSets) => {
        set({ imageSets });
    },

    // --- Dimension Lines ---
    setDimensionLines: (lines) => set({ dimensionLines: lines }),

    addDimensionLine: (line) =>
        set((state) => ({ dimensionLines: [...state.dimensionLines, line] })),

    updateDimensionLine: (line) =>
        set((state) => {
            const index = state.dimensionLines.findIndex(
                (l) => l.id === line.id
            );
            if (index !== -1) {
                const newLines = [...state.dimensionLines];
                newLines[index] = line;
                return { dimensionLines: newLines };
            }
            return state;
        }),

    removeDimensionLine: (id) =>
        set((state) => ({
            dimensionLines: state.dimensionLines.filter((l) => l.id !== id),
        })),

    // --- Settings ---
    setUnitFactor: (factor) => {
        set({ unitFactor: factor });
        getIPCService().updateUnitFactor(factor);
    },

    syncUnitFactor: (factor) => {
        set({ unitFactor: factor });
    },

    setWindowColor: (color) => {
        set({ windowColor: color });
    },

    // --- Bulk Actions ---
    loadProjectData: (project) => {
        const newImageSets = project.images;
        const newDimensionLines = project.dimensionLines || [];
        const newUnitFactor = project.settings.unitFactor;
        const newWindowColor = project.window.color;

        set({
            imageSets: newImageSets,
            dimensionLines: newDimensionLines,
            unitFactor: newUnitFactor,
            windowColor: newWindowColor,
        });

        getIPCService().updateImageSets(newImageSets);
        getIPCService().updateUnitFactor(newUnitFactor);
    },

    resetProjectData: () => {
        const defaultImageSets = [createDefaultImageSet()];
        set({
            imageSets: defaultImageSets,
            dimensionLines: [],
            unitFactor: 1.0,
            windowColor: "#00000000",
        });
        getIPCService().updateImageSets(defaultImageSets);
        getIPCService().updateUnitFactor(1.0);
    },
});
