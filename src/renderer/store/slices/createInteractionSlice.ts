import { StateCreator } from "zustand";
import type { InteractionMode } from "../../../shared/types/InteractionMode";

export interface InteractionSlice {
    interactionMode: InteractionMode;
    selectedImageId: string | null;
    selectedDimensionLineId: string | null;

    setInteractionMode: (mode: InteractionMode) => void;
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
        set(() => {
            if (mode === "default") {
                return {
                    interactionMode: mode,
                    selectedDimensionLineId: null,
                };
            }

            if (mode === "dimension_add") {
                return {
                    interactionMode: mode,
                    selectedImageId: null,
                    selectedDimensionLineId: null,
                };
            }

            return {
                interactionMode: mode,
                selectedImageId: null,
            };
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
