import { expect, test, describe } from "vitest";
import { imageSetsSlice, setImageSets, updateImageSet } from "./imageSetsSlice";

// Reducerのテストを行うため、reducerを取得
const reducer = imageSetsSlice.reducer;

describe("imageSetsSlice", () => {
  test("should handle initial state", () => {
    const state = reducer(undefined, { type: "unknown" });
    expect(state.imageSets).toHaveLength(1);
    expect(state.imageSets[0].path).toBe("");
  });

  test("should handle setImageSets", () => {
    const previousState = { imageSets: [] };
    const newSets = [
      {
        id: "123",
        path: "test.jpg",
        transparency: 1,
        init_anchor_pos: null,
        current_anchor_pos: null,
      },
    ];
    const state = reducer(previousState, setImageSets(newSets));
    expect(state.imageSets).toEqual(newSets);
  });

  test("should handle updateImageSet by index", () => {
    const previousState = {
      imageSets: [
        {
          id: "1",
          path: "old.jpg",
          transparency: 0,
          init_anchor_pos: null,
          current_anchor_pos: null,
        },
      ],
    };
    const updatedSet = {
      id: "1",
      path: "new.jpg",
      transparency: 1,
      init_anchor_pos: null,
      current_anchor_pos: null,
    };

    const state = reducer(
      previousState,
      updateImageSet({ index: 0, imageSet: updatedSet })
    );
    expect(state.imageSets[0]).toEqual(updatedSet);
  });

  test("should handle updateImageSet by id", () => {
    const previousState = {
      imageSets: [
        {
          id: "abc",
          path: "old.jpg",
          transparency: 0,
          init_anchor_pos: null,
          current_anchor_pos: null,
        },
      ],
    };
    const updatedSet = {
      id: "abc",
      path: "new.jpg",
      transparency: 1,
      init_anchor_pos: null,
      current_anchor_pos: null,
    };

    const state = reducer(
      previousState,
      updateImageSet({ id: "abc", imageSet: updatedSet })
    );
    expect(state.imageSets[0]).toEqual(updatedSet);
  });
});
