import { StateCreator } from "zustand";

export interface InteractionSlice {
  interactionMode: "default" | "dimension";
  selectedImageId: string | null;
  selectedDimensionLineId: string | null;

  setInteractionMode: (mode: "default" | "dimension") => void;
  selectImage: (id: string | null) => void;
  selectDimensionLine: (id: string | null) => void;
  deselectAll: () => void;
}

export const createInteractionSlice: StateCreator<InteractionSlice> = (
  set
) => ({
  interactionMode: "default",
  selectedImageId: null,
  selectedDimensionLineId: null,

  setInteractionMode: (mode) =>
    set({
      interactionMode: mode,
      // モード切替時に選択状態をリセットする場合
      selectedImageId: null,
      selectedDimensionLineId: null,
    }),

  selectImage: (id) => {
    set({
      selectedImageId: id,
      // 画像選択時は寸法線選択を解除
      selectedDimensionLineId: null,
    });
  },

  selectDimensionLine: (id) =>
    set({
      selectedDimensionLineId: id,
      // 寸法線選択時は画像選択を解除
      selectedImageId: null,
    }),

  deselectAll: () => {
    set({
      selectedImageId: null,
      selectedDimensionLineId: null,
    });
  },
});
