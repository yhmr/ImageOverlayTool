import { StateCreator } from "zustand";
import { ImageSet } from "../../../shared/types/ImageSet";
import { DimensionLine } from "../../../shared/types/DimensionLine";
import { ProjectFile } from "../../../shared/types/ProjectFile";
import UUID from "uuidjs";
import { IIPCService } from "../../services/ipcService";

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

/**
 * ProjectDataSliceを作成するファクトリー関数
 * @param ipcService 依存性注入されるIPCサービス
 */
export const createProjectDataSlice = (
    ipcService: IIPCService
): StateCreator<ProjectDataSlice> => {
    return (set) => ({
        imageSets: [createDefaultImageSet()],
        dimensionLines: [],
        unitFactor: 1.0,
        windowColor: "#00000000",

        // --- Image Sets ---
        setImageSets: (imageSets) => {
            set({ imageSets });
            ipcService.updateImageSets(imageSets);
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
                ipcService.updateImageSets(newImageSets);
                return { imageSets: newImageSets };
            });
        },

        syncImageSets: (imageSets) => {
            set({ imageSets });
        },

        // --- Dimension Lines ---
        setDimensionLines: (lines) => set({ dimensionLines: lines }),

        addDimensionLine: (line) =>
            set((state) => ({
                dimensionLines: [...state.dimensionLines, line],
            })),

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
            ipcService.updateUnitFactor(factor);
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

            ipcService.updateImageSets(newImageSets);
            ipcService.updateUnitFactor(newUnitFactor);
        },

        resetProjectData: () => {
            const defaultImageSets = [createDefaultImageSet()];
            // windowColorは意図的に保持する（ユーザーの背景色設定を維持）
            set({
                imageSets: defaultImageSets,
                dimensionLines: [],
                unitFactor: 1.0,
            });
            ipcService.updateImageSets(defaultImageSets);
            ipcService.updateUnitFactor(1.0);
        },
    });
};
