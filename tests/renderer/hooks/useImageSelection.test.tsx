/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useImageSelection } from "@/renderer/hooks/useImageSelection";
import { useAppStore } from "@/renderer/store/useAppStore";

// Mock Electron API
window.electronAPI = {
    updateImageSets: vi.fn(),
    updateUnitFactor: vi.fn(),
    updateUnit: vi.fn(),
    onUnitUpdated: vi.fn(() => vi.fn()),
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

    it("should handle onSelect via getOnSelectHandler", () => {
        const { result, rerender } = renderHook(() => useImageSelection());

        act(() => {
            useAppStore.getState().setImageSets([
                {
                    id: "image-1",
                    path: "test.png",
                    transparency: 0,
                    rotation: 0,
                    init_anchor_pos: null,
                    current_anchor_pos: null,
                },
                {
                    id: "image-2",
                    path: "test2.png",
                    transparency: 0,
                    rotation: 0,
                    init_anchor_pos: null,
                    current_anchor_pos: null,
                }
            ]);
        });

        // 1. Normal mode -> select
        act(() => {
            result.current.getOnSelectHandler("image-1")();
        });
        expect(useAppStore.getState().selectedImageId).toBe("image-1");

        // 2. Dimension mode -> should NOT change selection
        act(() => {
            useAppStore.getState().setInteractionMode("dimension");
        });

        // Mode switch triggers re-render in actual app, here we might need rerender() 
        // to ensure the hook sees the latest interactionMode
        rerender();

        act(() => {
            result.current.getOnSelectHandler("image-2")();
        });

        // Mode switch already set selectedImageId to null. 
        // getOnSelectHandler(image-2) should NOT change it back.
        expect(useAppStore.getState().selectedImageId).toBeNull();
    });
});
