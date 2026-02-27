/**
 * @vitest-environment happy-dom
 */
import { act, renderHook } from "@testing-library/react";
import type Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import type { RefObject } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useDimensionLineMode } from "@/renderer/main-window/hooks/useDimensionLineMode";
import { useAppStore } from "@/renderer/store/useAppStore";

type StagePoint = { x: number; y: number };

type TransformStub = {
    invert: () => void;
    point: (value: StagePoint) => StagePoint;
};

type StageStub = {
    getPointerPosition: () => StagePoint | null;
    getAbsoluteTransform: () => {
        copy: () => TransformStub;
    };
};

const mockPoint = vi
    .fn<(value: StagePoint) => StagePoint>()
    .mockReturnValue({ x: 100, y: 100 });

const createStageStub = (
    pointerPosition: StagePoint | null = { x: 50, y: 50 }
): StageStub => ({
    getPointerPosition: vi.fn(() => pointerPosition),
    getAbsoluteTransform: vi.fn(() => ({
        copy: vi.fn(() => ({
            invert: vi.fn(),
            point: mockPoint,
        })),
    })),
});

const createStageRef = (
    stage: StageStub | null
): RefObject<Konva.Stage | null> =>
    ({ current: stage as unknown as Konva.Stage | null }) as RefObject<
        Konva.Stage | null
    >;

const createStageMouseDownEvent = (
    button = 0,
    targetType = "Stage"
): KonvaEventObject<MouseEvent | TouchEvent> =>
    ({
        evt: { button } as MouseEvent,
        target: { getType: () => targetType },
    }) as unknown as KonvaEventObject<MouseEvent | TouchEvent>;

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
    beforeEach(() => {
        useAppStore.getState().resetAll();
        vi.clearAllMocks();
        mockPoint.mockReturnValue({ x: 100, y: 100 });
    });

    it("should initialize with default values", () => {
        const { result } = renderHook(() =>
            useDimensionLineMode(createStageRef(createStageStub()))
        );
        expect(result.current.isDimensionMode).toBe(false);
        expect(result.current.dimensionLines).toEqual([]);
        expect(result.current.unitFactor).toBe(1.0);
    });

    it("should toggle dimension mode", () => {
        const { result } = renderHook(() =>
            useDimensionLineMode(createStageRef(createStageStub()))
        );

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
        const { result } = renderHook(() =>
            useDimensionLineMode(createStageRef(createStageStub()))
        );

        act(() => {
            result.current.setDimensionModeEnabled(true);
        });

        mockPoint.mockReturnValue({ x: 100, y: 100 });
        act(() => {
            result.current.onMouseDown(createStageMouseDownEvent());
        });

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
        const { result } = renderHook(() =>
            useDimensionLineMode(createStageRef(createStageStub()))
        );

        act(() => {
            result.current.setDimensionModeEnabled(true);
        });

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

        act(() => {
            result.current.setDimensionModeEnabled(true);
        });
        mockPoint.mockReturnValue({ x: 300, y: 300 });
        act(() => {
            result.current.onMouseDown(createStageMouseDownEvent());
        });

        mockPoint.mockReturnValue({ x: 301, y: 300 });
        act(() => {
            result.current.onMouseMove();
        });

        act(() => {
            result.current.onMouseUp();
        });

        expect(useAppStore.getState().dimensionLines).toHaveLength(1);
        expect(useAppStore.getState().interactionMode).toBe("dimension_add");
    });

    it("should push undo history only when line is fixed", () => {
        const { result } = renderHook(() =>
            useDimensionLineMode(createStageRef(createStageStub()))
        );

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

    it("should no-op on mousedown for non-stage target and non-left click", () => {
        const { result } = renderHook(() =>
            useDimensionLineMode(createStageRef(createStageStub()))
        );
        act(() => {
            result.current.setDimensionModeEnabled(true);
        });

        act(() => {
            result.current.onMouseDown(createStageMouseDownEvent(0, "Rect"));
        });
        act(() => {
            result.current.onMouseDown(createStageMouseDownEvent(1, "Stage"));
        });

        expect(useAppStore.getState().dimensionLines).toHaveLength(0);
    });

    it("should clear selected dimension id when clicking stage in select mode", () => {
        const { result } = renderHook(() =>
            useDimensionLineMode(createStageRef(createStageStub()))
        );
        act(() => {
            useAppStore.getState().setInteractionMode("dimension_select");
            useAppStore.getState().setSelectedDimensionLineId("line-1");
        });

        act(() => {
            result.current.onMouseDown(createStageMouseDownEvent());
        });

        expect(useAppStore.getState().selectedDimensionLineId).toBeNull();
        expect(useAppStore.getState().interactionMode).toBe("dimension_select");
    });

    it("should ignore stage click when not in add/select mode", () => {
        const { result } = renderHook(() =>
            useDimensionLineMode(createStageRef(createStageStub()))
        );
        act(() => {
            useAppStore.getState().setInteractionMode("default");
        });

        act(() => {
            result.current.onMouseDown(createStageMouseDownEvent());
        });

        expect(useAppStore.getState().dimensionLines).toHaveLength(0);
        expect(useAppStore.getState().selectedDimensionLineId).toBeNull();
    });

    it("should no-op when stage or pointer position is unavailable", () => {
        const nullStageRef = createStageRef(null);
        const pointerNullRef = createStageRef(createStageStub(null));

        const { result: nullStageResult } = renderHook(() =>
            useDimensionLineMode(nullStageRef)
        );
        act(() => {
            nullStageResult.current.setDimensionModeEnabled(true);
            nullStageResult.current.onMouseDown(createStageMouseDownEvent());
            nullStageResult.current.onMouseMove();
            nullStageResult.current.onMouseUp();
        });
        expect(useAppStore.getState().dimensionLines).toHaveLength(0);

        const { result: pointerNullResult } = renderHook(() =>
            useDimensionLineMode(pointerNullRef)
        );
        act(() => {
            pointerNullResult.current.setDimensionModeEnabled(true);
            pointerNullResult.current.onMouseDown(createStageMouseDownEvent());
            pointerNullResult.current.onMouseMove();
            pointerNullResult.current.onMouseUp();
        });
        expect(useAppStore.getState().dimensionLines).toHaveLength(0);
    });

    it("should keep draft untouched when moving without an active draft line", () => {
        const { result } = renderHook(() =>
            useDimensionLineMode(createStageRef(createStageStub()))
        );

        act(() => {
            result.current.onMouseMove();
            result.current.onMouseUp();
        });

        expect(useAppStore.getState().dimensionLines).toHaveLength(0);
    });
});
