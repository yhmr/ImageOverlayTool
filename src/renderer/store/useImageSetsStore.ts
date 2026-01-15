import { create } from "zustand";
import UUID from "uuidjs";
import { ImageSet } from "../types/ImageSet";

interface ImageSetsState {
  imageSets: ImageSet[];

  // Actions
  setImageSets: (imageSets: ImageSet[]) => void;
  updateImageSet: (payload: {
    index?: number;
    id?: string;
    imageSet: ImageSet;
  }) => void;
  setAllImageSets: (imageSets: ImageSet[]) => void;
  syncImageSets: (imageSets: ImageSet[]) => void;
}

export const useImageSetsStore = create<ImageSetsState>((set) => ({
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

  // 全体更新
  setImageSets: (imageSets) => {
    set({ imageSets });
    window.electronAPI.updateImageSets(imageSets); // Sync
  },

  // 単体更新
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

      // 更新後の値を送信
      window.electronAPI.updateImageSets(newImageSets);

      return { imageSets: newImageSets };
    });
  },

  // 一括置換 (load用)
  setAllImageSets: (imageSets) => {
    set({ imageSets });
    window.electronAPI.updateImageSets(imageSets); // Sync
  },

  // 同期受信用
  syncImageSets: (imageSets) => {
    set({ imageSets });
  },
}));
