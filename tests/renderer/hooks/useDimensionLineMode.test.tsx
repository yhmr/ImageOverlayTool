/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDimensionLineMode } from "@/renderer/hooks/useDimensionLineMode";
import { useAppStore } from "@/renderer/store/useAppStore";
import { RefObject } from "react";
import Konva from "konva";

// Mock Konva Stage
const mockStage = {
    getPointerPosition: vi.fn().mockReturnValue({ x: 50, y: 50 }),
    getAbsoluteTransform: vi.fn().mockReturnValue({
        copy: vi.fn().mockReturnValue({
            invert: vi.fn(),
            point: vi.fn().mockReturnValue({ x: 100, y: 100 }),
        }),
    }),
} as unknown as Konva.Stage;

const stageRef = { current: mockStage } as RefObject<Konva.Stage>;

// Mock Electron API
window.electronAPI = {
    updateImageSets: vi.fn(),
    updateUnitFactor: vi.fn(),
} as any;

describe("useDimensionLineMode", () => {
    beforeEach(() => {
        useAppStore.getState().resetAll();
        vi.clearAllMocks();
    });

    it("should initialize with default values", () => {
        const { result } = renderHook(() => useDimensionLineMode(stageRef));
        expect(result.current.isDimensionMode).toBe(false);
        expect(result.current.dimensionLines).toEqual([]);
        expect(result.current.unitFactor).toBe(1.0);
    });

    it("should toggle dimension mode", () => {
        const { result } = renderHook(() => useDimensionLineMode(stageRef));

        act(() => {
            result.current.setIsDimensionMode(true);
        });
        expect(result.current.isDimensionMode).toBe(true);
        expect(useAppStore.getState().interactionMode).toBe("dimension");

        act(() => {
            result.current.setIsDimensionMode(false);
        });
        expect(result.current.isDimensionMode).toBe(false);
        expect(useAppStore.getState().interactionMode).toBe("default");
    });

    it("should add dimension line on mouse down when in mode", () => {
        const { result } = renderHook(() => useDimensionLineMode(stageRef));

        act(() => {
            result.current.setIsDimensionMode(true);
        });

        const mockEvent = {
            evt: { button: 0 }, // Left click
        } as any;

        act(() => {
            result.current.onMouseDown(mockEvent);
        });

        // Check if line added
        const lines = useAppStore.getState().dimensionLines;
        expect(lines).toHaveLength(1);
        expect(result.current.selectedDimensionLineId).toBe(lines[0].id);
    });

    it("should update line on mouse move and handle mouse up", () => {
        const { result } = renderHook(() => useDimensionLineMode(stageRef));
        const mockPoint = mockStage.getAbsoluteTransform().copy().point as any;

        act(() => {
            result.current.setIsDimensionMode(true);
        });

        // 1. Long line (should persist)
        mockPoint.mockReturnValue({ x: 100, y: 100 });
        act(() => {
            result.current.onMouseDown({ evt: { button: 0 } } as any);
        });

        mockPoint.mockReturnValue({ x: 200, y: 200 });
        act(() => {
            result.current.onMouseMove();
        });

        act(() => {
            result.current.onMouseUp();
        });

        expect(useAppStore.getState().dimensionLines).toHaveLength(1);

        // 2. Short line (should be removed)
        mockPoint.mockReturnValue({ x: 300, y: 300 });
        act(() => {
            result.current.onMouseDown({ evt: { button: 0 } } as any);
        });

        // Distance = 1 (< MIN_DIMENSION_LINE_DISTANCE = 2)
        mockPoint.mockReturnValue({ x: 301, y: 300 });
        act(() => {
            result.current.onMouseMove();
        });

        act(() => {
            result.current.onMouseUp();
        });

        // Only the first long line should remain
        expect(useAppStore.getState().dimensionLines).toHaveLength(1);
    });
});
