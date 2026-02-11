import { StateCreator } from "zustand";

export interface InteractionSlice {
    interactionMode: "default" | "dimension";
    selectedImageId: string | null;
    selectedDimensionLineId: string | null;

    setInteractionMode: (mode: "default" | "dimension") => void;
    setSelectedImageId: (id: string | null) => void;
    setSelectedDimensionLineId: (id: string | null) => void;
    clearSelection: () => void;
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

    setSelectedImageId: (id) => {
        set({
            selectedImageId: id,
            // 画像選択時は寸法線選択を解除
            selectedDimensionLineId: null,
        });
    },

    setSelectedDimensionLineId: (id) =>
        set({
            selectedDimensionLineId: id,
            // 寸法線選択時は画像選択を解除
            selectedImageId: null,
        }),

    clearSelection: () => {
        set({
            selectedImageId: null,
            selectedDimensionLineId: null,
        });
    },
});
