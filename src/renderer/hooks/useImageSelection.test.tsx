/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useImageSelection } from "./useImageSelection";
import { useAppStore } from "../store/useAppStore";

// Mock Electron API
window.electronAPI = {
  updateImageSets: vi.fn(),
  updateUnitFactor: vi.fn(),
} as any;

describe("useImageSelection", () => {
  beforeEach(() => {
    useAppStore.getState().resetAll(); // Reset
  });

  it("should select image", () => {
    const { result } = renderHook(() => useImageSelection());

    // Add image first
    act(() => {
      useAppStore.getState().setImageSets([
        {
          id: "test-id",
          path: "test.png",
          transparency: 0,
          rotation: 0,
          init_anchor_pos: null,
          current_anchor_pos: null,
        },
      ]);
      result.current.setSelectedImageId("test-id");
    });
    expect(result.current.selectedImageId).toBe("test-id");
    expect(useAppStore.getState().selectedImageId).toBe("test-id");
  });

  it("should deselect when image is removed from store", () => {
    const { result } = renderHook(() => useImageSelection());

    // Add image
    act(() => {
      useAppStore.getState().setImageSets([
        {
          id: "test-id",
          path: "",
          transparency: 0,
          rotation: 0,
          init_anchor_pos: null,
          current_anchor_pos: null,
        },
      ]);
      result.current.setSelectedImageId("test-id");
    });

    expect(result.current.selectedImageId).toBe("test-id");

    // Remove image
    act(() => {
      useAppStore.getState().setImageSets([]);
    });

    expect(result.current.selectedImageId).toBeNull();
  });
});
