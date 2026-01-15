import { StateCreator } from "zustand";
import { ImageSet } from "../../types/ImageSet";
import { DimensionLine } from "../../../shared/types/DimensionLine";
import { ProjectFile } from "../../../shared/types/ProjectFile";
import UUID from "uuidjs";

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
  syncImageSets: (imageSets: ImageSet[]) => void; // IPC受信時 (送信しない)

  setDimensionLines: (lines: DimensionLine[]) => void;
  addDimensionLine: (line: DimensionLine) => void;
  updateDimensionLine: (line: DimensionLine) => void;
  removeDimensionLine: (id: string) => void;

  setUnitFactor: (factor: number) => void;
  syncUnitFactor: (factor: number) => void; // IPC受信時 (送信しない)

  setWindowColor: (color: string) => void;

  loadProjectData: (project: ProjectFile<ImageSet>) => void;
  resetProjectData: () => void;
}

export const createProjectDataSlice: StateCreator<ProjectDataSlice> = (
  set,
  get
) => ({
  imageSets: [
    {
      id: UUID.generate(),
      path: "",
      transparency: 0,
      rotation: 0,
      init_anchor_pos: null,
      current_anchor_pos: null,
    },
  ],
  dimensionLines: [],
  unitFactor: 1.0,
  windowColor: "#00000000",

  // --- Image Sets ---
  setImageSets: (imageSets) => {
    set({ imageSets });
    window.electronAPI.updateImageSets(imageSets);
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
      window.electronAPI.updateImageSets(newImageSets);
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
      const index = state.dimensionLines.findIndex((l) => l.id === line.id);
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
    window.electronAPI.updateUnitFactor(factor);
  },

  syncUnitFactor: (factor) => {
    set({ unitFactor: factor });
  },

  setWindowColor: (color) => {
    set({ windowColor: color });
  },

  // --- Bulk Actions ---
  loadProjectData: (project) => {
    // データの一括ロード
    // 注意: 個別のsetterを呼ぶとIPCが飛ぶ可能性があるため、ここで一括設定して必要なIPCだけ飛ばすか、
    // あるいは単純にstate更新だけ行い、同期は別途制御するか。
    // ここではstate更新 + 必要な同期を行う。

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

    window.electronAPI.updateImageSets(newImageSets);
    window.electronAPI.updateUnitFactor(newUnitFactor);
    // windowColor and dimensionLines do not require IPC sync for now.
  },

  resetProjectData: () => {
    set({
      imageSets: [
        {
          id: UUID.generate(),
          path: "",
          transparency: 0,
          rotation: 0,
          init_anchor_pos: null,
          current_anchor_pos: null,
        },
      ],
      dimensionLines: [],
      unitFactor: 1.0,
      windowColor: "#00000000",
    });
    // Reset時も同期
    const initialState = get();
    // 今セットしたものを取得したいが、set直後は取れないかもしれないので値リテラルを使うか、
    // またはStateCreatorの第３引数apiを使う。
    // ここではシンプルに初期値を送る。
    const defaultImageSets = [
      {
        id: UUID.generate(),
        path: "",
        transparency: 0,
        rotation: 0,
        init_anchor_pos: null,
        current_anchor_pos: null,
      },
    ];
    window.electronAPI.updateImageSets(defaultImageSets);
    window.electronAPI.updateUnitFactor(1.0);
  },
});
