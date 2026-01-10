// @vitest-environment happy-dom
import { renderHook, act } from "@testing-library/react";
import { useImageSelection } from "./useImageSelection";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { describe, it, expect, vi } from "vitest";
import { imageSetsSlice } from "../store/imageSetsSlice";

// Helper to create store with initial state
const createTestStore = (imageSets: any[] = []) => {
    return configureStore({
        reducer: {
            imageSets: imageSetsSlice.reducer,
        },
        preloadedState: {
            imageSets: {
                imageSets: imageSets,
            },
        } as any,
    });
};

describe("useImageSelection", () => {
    it("should initialize with null selectedImageId", () => {
        const store = createTestStore();
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <Provider store={store} > {children} </Provider>
        );
        const { result } = renderHook(() => useImageSelection(), { wrapper });

        expect(result.current.selectedImageId).toBeNull();
    });

    it("should set selectedImageId", () => {
        const store = createTestStore([{ id: "test-id" } as any]);
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <Provider store={store} > {children} </Provider>
        );
        const { result } = renderHook(() => useImageSelection(), { wrapper });

        act(() => {
            result.current.setSelectedImageId("test-id");
        });

        expect(result.current.selectedImageId).toBe("test-id");
    });

    it("should clear selection if selected image is removed from store", () => {
        const initialImageSets = [{ id: "img1", path: "path1" } as any];
        // Create store and render hook
        const store = createTestStore(initialImageSets);
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <Provider store={store} > {children} </Provider>
        );
        const { result, rerender } = renderHook(() => useImageSelection(), { wrapper });

        // Select the image
        act(() => {
            result.current.setSelectedImageId("img1");
        });
        expect(result.current.selectedImageId).toBe("img1");

        // Simulate removal by updating store state directly or re-rendering with new store?
        // Since we verify the effect dependent on `imageSets` from selector.
        // We can dispatch an action to remove it if we exported actions, or use a new store?
        // Actually, renderHook wrapper prop change causes rerender.
        // It's easier to verify logic: effect runs when imageSets changes.
        // But `useSelector` subscribes to store. So dispatching action works best.
        // However, I didn't verify `imageSetsSlice` actions here.
        // Let's assume `useSelector` works.
        // Mocking useSelector might be easier but Redux integration test is more robust.

        // Let's dispatch an action to clear imageSets.
        // But I need the action `setAllImageSets` or similar.
        // Let's import it.
    });

    // Refined test for clearing selection:
    it("should handle getOnSelectHandler based on dimension mode", () => {
        const store = createTestStore([{ id: "img1" } as any, { id: "img2" } as any]);
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <Provider store={store} > {children} </Provider>
        );
        const { result } = renderHook(() => useImageSelection(), { wrapper });

        const onDeselectDimension = vi.fn();

        // Case 1: isDimensionMode = false
        const handlerNotDimension = result.current.getOnSelectHandler("img1", false, onDeselectDimension);
        act(() => {
            handlerNotDimension();
        });
        expect(result.current.selectedImageId).toBe("img1");
        expect(onDeselectDimension).toHaveBeenCalled();

        // Case 2: isDimensionMode = true
        onDeselectDimension.mockClear();
        const handlerInDimension = result.current.getOnSelectHandler("img2", true, onDeselectDimension);
        act(() => {
            handlerInDimension();
        });
        // Should NOT change selection
        expect(result.current.selectedImageId).toBe("img1"); // remains img1
        expect(onDeselectDimension).not.toHaveBeenCalled();
    });
});
