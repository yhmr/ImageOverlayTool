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

// Mock IPCService
const mockIPC = vi.hoisted(() => ({
    updateImageSets: vi.fn(),
    updateUnitFactor: vi.fn(),
    updateUnit: vi.fn(),
    onUnitUpdated: vi.fn(() => vi.fn()),
}));

vi.mock("@/renderer/services/ipcService", () => ({
    getIPCService: () => mockIPC,
    setIPCService: vi.fn(),
}));

describe("useDimensionLineMode", () => {
    const createStageMouseDownEvent = () =>
        ({
            evt: { button: 0 },
            target: { getType: () => "Stage" },
        }) as any;

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
            result.current.setDimensionModeEnabled(true);
        });
        expect(result.current.isDimensionMode).toBe(true);
        expect(useAppStore.getState().interactionMode).toBe("dimension_add");

        act(() => {
            result.current.setDimensionModeEnabled(false);
        });
        expect(result.current.isDimensionMode).toBe(false);
        expect(useAppStore.getState().interactionMode).toBe("default");
    });

    it("should commit dimension line on mouse up when in mode", () => {
        const { result } = renderHook(() => useDimensionLineMode(stageRef));
        const mockPoint = mockStage.getAbsoluteTransform().copy().point as any;

        act(() => {
            result.current.setDimensionModeEnabled(true);
        });

        const mockEvent = createStageMouseDownEvent();
        mockPoint.mockReturnValue({ x: 100, y: 100 });

        act(() => {
            result.current.onMouseDown(mockEvent);
        });

        // Draft only: no commit before mouse up
        expect(useAppStore.getState().dimensionLines).toHaveLength(0);

        mockPoint.mockReturnValue({ x: 200, y: 200 });
        act(() => {
            result.current.onMouseMove();
        });

        act(() => {
            result.current.onMouseUp();
        });

        const lines = useAppStore.getState().dimensionLines;
        expect(lines).toHaveLength(1);
        expect(result.current.selectedDimensionLineId).toBe(lines[0]?.id);
        expect(useAppStore.getState().interactionMode).toBe("dimension_select");
    });

    it("should update line on mouse move and handle mouse up", () => {
        const { result } = renderHook(() => useDimensionLineMode(stageRef));
        const mockPoint = mockStage.getAbsoluteTransform().copy().point as any;

        act(() => {
            result.current.setDimensionModeEnabled(true);
        });

        // 1. Long line (should persist)
        mockPoint.mockReturnValue({ x: 100, y: 100 });
        act(() => {
            result.current.onMouseDown(createStageMouseDownEvent());
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
        act(() => {
            result.current.setDimensionModeEnabled(true);
        });
        mockPoint.mockReturnValue({ x: 300, y: 300 });
        act(() => {
            result.current.onMouseDown(createStageMouseDownEvent());
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
        expect(useAppStore.getState().interactionMode).toBe("dimension_add");
    });

    it("should push undo history only when line is fixed", () => {
        const { result } = renderHook(() => useDimensionLineMode(stageRef));
        const mockPoint = mockStage.getAbsoluteTransform().copy().point as any;

        useAppStore.temporal.getState().clear();

        act(() => {
            result.current.setDimensionModeEnabled(true);
        });

        mockPoint.mockReturnValue({ x: 100, y: 100 });
        act(() => {
            result.current.onMouseDown(createStageMouseDownEvent());
        });
        expect(useAppStore.temporal.getState().pastStates.length).toBe(0);

        mockPoint.mockReturnValue({ x: 200, y: 200 });
        act(() => {
            result.current.onMouseMove();
        });
        expect(useAppStore.temporal.getState().pastStates.length).toBe(0);

        act(() => {
            result.current.onMouseUp();
        });
        expect(useAppStore.temporal.getState().pastStates.length).toBe(1);
    });
});

