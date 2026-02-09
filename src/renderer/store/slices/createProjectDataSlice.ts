import { StateCreator, StoreApi } from "zustand";
import { ImageSet } from "../../../shared/types/ImageSet";
import { DimensionLine } from "../../../shared/types/DimensionLine";
import { ProjectFile } from "../../../shared/types/ProjectFile";
import UUID from "uuidjs";
import { IProjectDataSyncIPCService } from "../../services/ipcService";
import { TemporalState } from "zundo";

const createDefaultImageSet = (): ImageSet => ({
    id: UUID.generate(),
    path: "",
    transparency: 0,
    rotation: 0,
    init_anchor_pos: null,
    current_anchor_pos: null,
    locked: false,
});

export interface ProjectDataSlice {
    // Data State
    imageSets: ImageSet[];
    dimensionLines: DimensionLine[];
    unitFactor: number;
    unit: "nm" | "um" | "mm";
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

    setUnit: (unit: "nm" | "um" | "mm") => void;
    syncUnit: (unit: "nm" | "um" | "mm") => void;

    setWindowColor: (color: string) => void;

    loadProjectData: (project: ProjectFile<ImageSet>) => void;
    resetProjectData: () => void;
}

/**
 * ProjectDataSliceを作成するファクトリー関数
 * @param ipcService 依存性注入されるIPCサービス
 * @param getTemporal zundoのtemporal stateを取得する関数
 */
export const createProjectDataSlice = (
    ipcService: IProjectDataSyncIPCService,
    getTemporal: () => StoreApi<TemporalState<unknown>> | undefined
): StateCreator<ProjectDataSlice> => {
    return (set) => ({
        imageSets: [createDefaultImageSet()],
        dimensionLines: [],
        unitFactor: 1.0,
        unit: "um",
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
            const temporal = getTemporal();
            if (temporal) temporal.getState().pause();
            set({ imageSets });
            if (temporal) temporal.getState().resume();
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
            const temporal = getTemporal();
            if (temporal) temporal.getState().pause();
            set({ unitFactor: factor });
            if (temporal) temporal.getState().resume();
        },

        setUnit: (unit) => {
            set({ unit });
            ipcService.updateUnit(unit);
        },

        syncUnit: (unit) => {
            const temporal = getTemporal();
            if (temporal) temporal.getState().pause();
            set({ unit });
            if (temporal) temporal.getState().resume();
        },

        setWindowColor: (color) => {
            set({ windowColor: color });
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
            });

            ipcService.updateImageSets(newImageSets);
            ipcService.updateUnitFactor(newUnitFactor);
            ipcService.updateUnit(newUnit);
        },

        resetProjectData: () => {
            const defaultImageSets = [createDefaultImageSet()];
            // windowColorは意図的に保持する（ユーザーの背景色設定を維持）
            set({
                imageSets: defaultImageSets,
                dimensionLines: [],
                unitFactor: 1.0,
                unit: "um",
            });
            ipcService.updateImageSets(defaultImageSets);
            ipcService.updateUnitFactor(1.0);
            ipcService.updateUnit("um");
        },
    });
};
