import { createSlice } from "@reduxjs/toolkit";

import UUID from "uuidjs";

import { ImageSet } from "../types/ImageSet";

interface Status {
  imageSets: Array<ImageSet>;
}

const initialState: Status = {
  // 初期値は空が１つ
  imageSets: [
    {
      id: UUID.generate(),
      path: "",
      transparency: 0,
      init_anchor_pos: null,
      current_anchor_pos: null,
    },
  ],
};

export const imageSetsSlice = createSlice({
  name: "imageSets",
  initialState,
  reducers: {
    // 全体更新
    setImageSets: (state, action) => {
      state.imageSets = action.payload;
    },
    // 単体更新
    updateImageSet: (state, action) => {
      if (Object.prototype.hasOwnProperty.call(action.payload, "index")) {
        // インデックス指定更新
        if (state.imageSets.length > action.payload.index) {
          state.imageSets[action.payload.index] = action.payload.imageSet;
        }
      } else if (Object.prototype.hasOwnProperty.call(action.payload, "id")) {
        // id指定更新
        const targetIndex = state.imageSets.findIndex(
          (set) => set.id === action.payload.id
        );
        if (targetIndex >= 0) {
          state.imageSets[targetIndex] = action.payload.imageSet;
        }
      }
    },
  },
});

export const { setImageSets, updateImageSet } = imageSetsSlice.actions;
