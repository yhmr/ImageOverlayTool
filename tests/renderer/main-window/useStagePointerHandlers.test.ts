/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";

import { useStagePointerHandlers } from "@/renderer/main-window/hooks/useStagePointerHandlers";

vi.mock("@/renderer/main-window/utils/setKonvaDragButtons", () => ({
    setKonvaDragButtons: vi.fn(),
}));

import { setKonvaDragButtons } from "@/renderer/main-window/utils/setKonvaDragButtons";

describe("useStagePointerHandlers", () => {
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
