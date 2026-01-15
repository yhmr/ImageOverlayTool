// @vitest-environment happy-dom
import { renderHook, act } from "@testing-library/react";
import { useImageSelection } from "./useImageSelection";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useImageSetsStore } from "../store/useImageSetsStore";
import { ImageSet } from "../types/ImageSet";

describe("useImageSelection", () => {
  beforeEach(() => {
    useImageSetsStore.setState(useImageSetsStore.getInitialState());
  });

  it("should initialize with null selectedImageId", () => {
    const { result } = renderHook(() => useImageSelection());
    expect(result.current.selectedImageId).toBeNull();
  });

  it("should set selectedImageId", () => {
    // Setup store
    useImageSetsStore.setState({
      imageSets: [{ id: "test-id" } as unknown as ImageSet],
    });

    const { result } = renderHook(() => useImageSelection());

    act(() => {
      result.current.setSelectedImageId("test-id");
    });

    expect(result.current.selectedImageId).toBe("test-id");
  });

  it("should clear selection if selected image is removed from store", () => {
    useImageSetsStore.setState({
      imageSets: [{ id: "img1" } as unknown as ImageSet],
    });

    const { result } = renderHook(() => useImageSelection());

    // Select the image
    act(() => {
      result.current.setSelectedImageId("img1");
    });
    expect(result.current.selectedImageId).toBe("img1");

    // Remove image from store
    act(() => {
      useImageSetsStore.setState({ imageSets: [] });
    });

    expect(result.current.selectedImageId).toBeNull();
  });

  it("should handle getOnSelectHandler based on dimension mode", () => {
    useImageSetsStore.setState({
      imageSets: [
        { id: "img1" } as unknown as ImageSet,
        { id: "img2" } as unknown as ImageSet,
      ],
    });

    const { result } = renderHook(() => useImageSelection());

    const onDeselectDimension = vi.fn();

    // Case 1: isDimensionMode = false
    const handlerNotDimension = result.current.getOnSelectHandler(
      "img1",
      false,
      onDeselectDimension
    );
    act(() => {
      handlerNotDimension();
    });
    expect(result.current.selectedImageId).toBe("img1");
    expect(onDeselectDimension).toHaveBeenCalled();

    // Case 2: isDimensionMode = true
    onDeselectDimension.mockClear();
    const handlerInDimension = result.current.getOnSelectHandler(
      "img2",
      true,
      onDeselectDimension
    );
    act(() => {
      handlerInDimension();
    });
    // Should NOT change selection
    expect(result.current.selectedImageId).toBe("img1"); // remains img1
    expect(onDeselectDimension).not.toHaveBeenCalled();
  });
});
