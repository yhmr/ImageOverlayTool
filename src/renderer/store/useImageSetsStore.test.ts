// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { act } from "@testing-library/react";
import { useImageSetsStore } from "./useImageSetsStore";
import { ImageSet } from "../../types/ImageSet";

// Mock electronAPI
const updateImageSetsMock = vi.fn();
window.electronAPI = {
  ...window.electronAPI,
  updateImageSets: updateImageSetsMock,
} as any;

const sampleImageSet: ImageSet = {
  id: "img1",
  path: "/path/to/image.png",
  transparency: 0,
  rotation: 0,
  init_anchor_pos: null,
  current_anchor_pos: null,
};

describe("useImageSetsStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useImageSetsStore.setState(useImageSetsStore.getInitialState());
  });

  it("should have correct initial state", () => {
    const state = useImageSetsStore.getState();
    expect(state.imageSets).toHaveLength(1);
  });

  describe("setImageSets", () => {
    it("should update imageSets and call IPC", () => {
      const { setImageSets } = useImageSetsStore.getState();
      const newSets = [sampleImageSet];
      act(() => {
        setImageSets(newSets);
      });
      const state = useImageSetsStore.getState();
      expect(state.imageSets).toEqual(newSets);
      expect(updateImageSetsMock).toHaveBeenCalledWith(newSets);
    });
  });

  describe("syncImageSets", () => {
    it("should update imageSets but NOT call IPC", () => {
      const { syncImageSets } = useImageSetsStore.getState();
      const newSets = [sampleImageSet];
      act(() => {
        syncImageSets(newSets);
      });
      const state = useImageSetsStore.getState();
      expect(state.imageSets).toEqual(newSets);
      expect(updateImageSetsMock).not.toHaveBeenCalled();
    });
  });

  describe("updateImageSet", () => {
    it("should update specific image set by index and call IPC", () => {
      const { setImageSets, updateImageSet } = useImageSetsStore.getState();
      // Setup initial state directly to avoid IPC call counting from setup
      useImageSetsStore.setState({ imageSets: [sampleImageSet] });
      updateImageSetsMock.mockClear();

      const updatedSet = { ...sampleImageSet, transparency: 0.5 };
      act(() => {
        updateImageSet({ index: 0, imageSet: updatedSet });
      });

      const state = useImageSetsStore.getState();
      expect(state.imageSets[0]).toEqual(updatedSet);
      expect(updateImageSetsMock).toHaveBeenCalledWith([updatedSet]);
    });
  });
});
