/**
 * @vitest-environment happy-dom
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";

import { useStagePointerHandlers } from "@/renderer/main-window/hooks/useStagePointerHandlers";

vi.mock("@/renderer/main-window/utils/setKonvaDragButtons", () => ({
    setKonvaDragButtons: vi.fn(),
}));

import { setKonvaDragButtons } from "@/renderer/main-window/utils/setKonvaDragButtons";

describe("useStagePointerHandlers", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("updates stage position on drag end only when target is Stage", () => {
        const onUpdateStage = vi.fn();
        const { result } = renderHook(() =>
            useStagePointerHandlers({
                stageRef: { current: null } as any,
                isDimensionMode: false,
                setSelectedImageId: vi.fn(),
                onMouseDownDimension: vi.fn(),
                onMouseMoveDimension: vi.fn(),
                onMouseUpDimension: vi.fn(),
                onUpdateStage,
            })
        );

        const stageTarget = {
            getType: () => "Stage",
            x: () => 12,
            y: () => 34,
            scaleX: () => 2,
        };
        result.current.onDragEnd({ target: stageTarget } as any);
        expect(onUpdateStage).toHaveBeenCalledWith({ x: 12, y: 34, scale: 2 });

        onUpdateStage.mockClear();
        result.current.onDragEnd({
            target: { getType: () => "Rect" },
        } as any);
        expect(onUpdateStage).not.toHaveBeenCalled();
    });

    it("clears selection on default mode left-clicking stage", () => {
        const setSelectedImageId = vi.fn();
        const stage = {
            draggable: vi.fn(),
        };
        const { result } = renderHook(() =>
            useStagePointerHandlers({
                stageRef: { current: stage } as any,
                isDimensionMode: false,
                setSelectedImageId,
                onMouseDownDimension: vi.fn(),
                onMouseMoveDimension: vi.fn(),
                onMouseUpDimension: vi.fn(),
                onUpdateStage: vi.fn(),
            })
        );

        result.current.onMouseDown({
            evt: { button: 0 },
            target: { getType: () => "Stage" },
        } as any);

        expect(setSelectedImageId).toHaveBeenCalledWith(null);
        expect(setKonvaDragButtons).toHaveBeenCalledWith([1, 2]);
        expect(stage.draggable).toHaveBeenCalledWith(true);
    });

    it("does not clear selection on default mode non-stage click", () => {
        const setSelectedImageId = vi.fn();
        const stage = {
            draggable: vi.fn(),
        };
        const { result } = renderHook(() =>
            useStagePointerHandlers({
                stageRef: { current: stage } as any,
                isDimensionMode: false,
                setSelectedImageId,
                onMouseDownDimension: vi.fn(),
                onMouseMoveDimension: vi.fn(),
                onMouseUpDimension: vi.fn(),
                onUpdateStage: vi.fn(),
            })
        );

        result.current.onMouseDown({
            evt: { button: 0 },
            target: { getType: () => "Rect" },
        } as any);

        expect(setSelectedImageId).not.toHaveBeenCalled();
    });

    it("uses left-button drag for dimension mode interactions", () => {
        const stage = {
            draggable: vi.fn(),
        };
        const onMouseDownDimension = vi.fn();

        const { result } = renderHook(() =>
            useStagePointerHandlers({
                stageRef: { current: stage } as any,
                isDimensionMode: true,
                setSelectedImageId: vi.fn(),
                onMouseDownDimension,
                onMouseMoveDimension: vi.fn(),
                onMouseUpDimension: vi.fn(),
                onUpdateStage: vi.fn(),
            })
        );

        result.current.onMouseDown({
            evt: { button: 0 },
            target: { getType: () => "Stage" },
        } as any);

        expect(setKonvaDragButtons).toHaveBeenCalledWith([0]);
        expect(stage.draggable).toHaveBeenCalledWith(false);
        expect(onMouseDownDimension).toHaveBeenCalledTimes(1);
    });

    it("keeps middle/right panning behavior in dimension mode", () => {
        const stage = {
            draggable: vi.fn(),
        };

        const { result } = renderHook(() =>
            useStagePointerHandlers({
                stageRef: { current: stage } as any,
                isDimensionMode: true,
                setSelectedImageId: vi.fn(),
                onMouseDownDimension: vi.fn(),
                onMouseMoveDimension: vi.fn(),
                onMouseUpDimension: vi.fn(),
                onUpdateStage: vi.fn(),
            })
        );

        result.current.onMouseDown({
            evt: { button: 2 },
            target: { getType: () => "Stage" },
        } as any);

        expect(setKonvaDragButtons).toHaveBeenCalledWith([1, 2]);
        expect(stage.draggable).toHaveBeenCalledWith(true);
    });

    it("treats touch-like event as left button and tolerates missing stageRef.current", () => {
        const { result } = renderHook(() =>
            useStagePointerHandlers({
                stageRef: { current: null } as any,
                isDimensionMode: true,
                setSelectedImageId: vi.fn(),
                onMouseDownDimension: vi.fn(),
                onMouseMoveDimension: vi.fn(),
                onMouseUpDimension: vi.fn(),
                onUpdateStage: vi.fn(),
            })
        );

        expect(() =>
            result.current.onMouseDown({
                evt: {},
                target: { getType: () => "Stage" },
            } as any)
        ).not.toThrow();
        expect(setKonvaDragButtons).toHaveBeenCalledWith([0]);
    });

    it("forwards mouse move and mouse up to dimension handlers", () => {
        const onMouseMoveDimension = vi.fn();
        const onMouseUpDimension = vi.fn();
        const stage = {
            draggable: vi.fn(),
        };

        const { result } = renderHook(() =>
            useStagePointerHandlers({
                stageRef: { current: stage } as any,
                isDimensionMode: false,
                setSelectedImageId: vi.fn(),
                onMouseDownDimension: vi.fn(),
                onMouseMoveDimension,
                onMouseUpDimension,
                onUpdateStage: vi.fn(),
            })
        );

        result.current.onMouseMove();
        result.current.onMouseUp();

        expect(onMouseMoveDimension).toHaveBeenCalledTimes(1);
        expect(onMouseUpDimension).toHaveBeenCalledTimes(1);
        expect(setKonvaDragButtons).toHaveBeenLastCalledWith([1, 2]);
        expect(stage.draggable).toHaveBeenLastCalledWith(true);
    });

    it("restores left-button drag after right-click pan completes", () => {
        const stage = {
            draggable: vi.fn(),
        };

        const { result } = renderHook(() =>
            useStagePointerHandlers({
                stageRef: { current: stage } as any,
                isDimensionMode: true,
                setSelectedImageId: vi.fn(),
                onMouseDownDimension: vi.fn(),
                onMouseMoveDimension: vi.fn(),
                onMouseUpDimension: vi.fn(),
                onUpdateStage: vi.fn(),
            })
        );

        result.current.onMouseDown({
            evt: { button: 2 },
            target: { getType: () => "Stage" },
        } as any);
        result.current.onMouseUp();

        expect(setKonvaDragButtons).toHaveBeenLastCalledWith([0]);
        expect(stage.draggable).toHaveBeenLastCalledWith(false);
    });
});
