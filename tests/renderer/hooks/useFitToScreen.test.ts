/**
 * @vitest-environment happy-dom
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";

import { useFitToScreen } from "@/renderer/hooks/useFitToScreen";
import { useAppStore } from "@/renderer/store/useAppStore";

const mockCalculateFitCanvasState = vi.hoisted(() => vi.fn());

vi.mock("@/renderer/main-window/utils/calculateFitCanvasState", () => ({
    calculateFitCanvasState: mockCalculateFitCanvasState,
}));

describe("useFitToScreen", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useAppStore.getState().resetAll();
    });

    it("returns early when image area container is missing", () => {
        vi.spyOn(document, "querySelector").mockReturnValue(null);
        const { result } = renderHook(() => useFitToScreen());

        act(() => {
            result.current.fitToScreen();
        });

        expect(mockCalculateFitCanvasState).not.toHaveBeenCalled();
    });

    it("returns early when fit canvas state cannot be calculated", () => {
        const container = document.createElement("div");
        vi.spyOn(container, "offsetWidth", "get").mockReturnValue(1000);
        vi.spyOn(container, "offsetHeight", "get").mockReturnValue(800);
        vi.spyOn(document, "querySelector").mockReturnValue(container);
        mockCalculateFitCanvasState.mockReturnValue(null);

        useAppStore.getState().setSelectedImageId("img-1");
        const beforeCanvas = useAppStore.getState().canvas;
        const { result } = renderHook(() => useFitToScreen());

        act(() => {
            result.current.fitToScreen();
        });

        expect(useAppStore.getState().selectedImageId).toBe("img-1");
        expect(useAppStore.getState().canvas).toEqual(beforeCanvas);
    });

    it("clears selection and applies fit canvas state when calculated", () => {
        const container = document.createElement("div");
        vi.spyOn(container, "offsetWidth", "get").mockReturnValue(1000);
        vi.spyOn(container, "offsetHeight", "get").mockReturnValue(800);
        vi.spyOn(document, "querySelector").mockReturnValue(container);
        mockCalculateFitCanvasState.mockReturnValue({ x: 10, y: 20, scale: 0.8 });

        useAppStore.getState().setSelectedImageId("img-1");
        const { result } = renderHook(() => useFitToScreen());

        act(() => {
            result.current.fitToScreen();
        });

        expect(useAppStore.getState().selectedImageId).toBeNull();
        expect(useAppStore.getState().canvas).toEqual({ x: 10, y: 20, scale: 0.8 });
    });
});
