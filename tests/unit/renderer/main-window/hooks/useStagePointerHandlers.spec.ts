/**
 * @vitest-environment happy-dom
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import type { RefObject } from "react";
import type Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";

import { useStagePointerHandlers } from "@/renderer/main-window/hooks/useStagePointerHandlers";

vi.mock("@/renderer/main-window/utils/setKonvaDragButtons", () => ({
    setKonvaDragButtons: vi.fn(),
}));

import { setKonvaDragButtons } from "@/renderer/main-window/utils/setKonvaDragButtons";

type StageStub = {
    draggable: (value: boolean) => void;
};

type StageDragTarget = {
    getType: () => string;
    x: () => number;
    y: () => number;
    scaleX: () => number;
};

type HookParams = Parameters<typeof useStagePointerHandlers>[0];

const createStageRef = (stage: StageStub | null): RefObject<Konva.Stage | null> =>
    ({ current: stage as unknown as Konva.Stage | null }) as RefObject<
        Konva.Stage | null
    >;

const createPointerEvent = (
    targetType: string,
    button?: number
): KonvaEventObject<MouseEvent | TouchEvent> =>
    ({
        evt:
            button === undefined
                ? ({} as TouchEvent)
                : ({ button } as MouseEvent),
        target: {
            getType: () => targetType,
        },
    }) as unknown as KonvaEventObject<MouseEvent | TouchEvent>;

const createDragEndEvent = (
    target: StageDragTarget | { getType: () => string }
): KonvaEventObject<DragEvent> =>
    ({ target }) as unknown as KonvaEventObject<DragEvent>;

const createParams = (overrides: Partial<HookParams> = {}): HookParams => ({
    stageRef: createStageRef(null),
    isDimensionMode: false,
    setSelectedImageId: vi.fn(),
    onMouseDownDimension: vi.fn(),
    onMouseMoveDimension: vi.fn(),
    onMouseUpDimension: vi.fn(),
    onUpdateStage: vi.fn(),
    ...overrides,
});

describe("useStagePointerHandlers", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("updates stage position on drag end when target is Stage", () => {
        const onUpdateStage = vi.fn();
        const { result } = renderHook(() =>
            useStagePointerHandlers(createParams({ onUpdateStage }))
        );

        result.current.onDragEnd(
            createDragEndEvent({
                getType: () => "Stage",
                x: () => 12,
                y: () => 34,
                scaleX: () => 2,
            })
        );

        expect(onUpdateStage).toHaveBeenCalledWith({ x: 12, y: 34, scale: 2 });
    });

    it("does not update stage position on drag end when target is not Stage", () => {
        const onUpdateStage = vi.fn();
        const { result } = renderHook(() =>
            useStagePointerHandlers(createParams({ onUpdateStage }))
        );

        result.current.onDragEnd(
            createDragEndEvent({
                getType: () => "Rect",
            })
        );

        expect(onUpdateStage).not.toHaveBeenCalled();
    });

    it("clears selection when left-clicking Stage in default mode", () => {
        const setSelectedImageId = vi.fn();
        const stage: StageStub = {
            draggable: vi.fn(),
        };
        const { result } = renderHook(() =>
            useStagePointerHandlers(
                createParams({
                    stageRef: createStageRef(stage),
                    setSelectedImageId,
                })
            )
        );

        result.current.onMouseDown(createPointerEvent("Stage", 0));

        expect(setSelectedImageId).toHaveBeenCalledWith(null);
        expect(setKonvaDragButtons).toHaveBeenCalledWith([1, 2]);
        expect(stage.draggable).toHaveBeenCalledWith(true);
    });

    it("does not clear selection when left-clicking non-Stage in default mode", () => {
        const setSelectedImageId = vi.fn();
        const stage: StageStub = {
            draggable: vi.fn(),
        };
        const { result } = renderHook(() =>
            useStagePointerHandlers(
                createParams({
                    stageRef: createStageRef(stage),
                    setSelectedImageId,
                })
            )
        );

        result.current.onMouseDown(createPointerEvent("Rect", 0));

        expect(setSelectedImageId).not.toHaveBeenCalled();
        expect(setKonvaDragButtons).toHaveBeenCalledWith([1, 2]);
        expect(stage.draggable).toHaveBeenCalledWith(true);
    });

    it("starts dimension interaction on left-click in dimension mode", () => {
        const stage: StageStub = {
            draggable: vi.fn(),
        };
        const onMouseDownDimension = vi.fn();
        const { result } = renderHook(() =>
            useStagePointerHandlers(
                createParams({
                    stageRef: createStageRef(stage),
                    isDimensionMode: true,
                    onMouseDownDimension,
                })
            )
        );

        result.current.onMouseDown(createPointerEvent("Stage", 0));

        expect(setKonvaDragButtons).toHaveBeenCalledWith([0]);
        expect(stage.draggable).toHaveBeenCalledWith(false);
        expect(onMouseDownDimension).toHaveBeenCalledTimes(1);
    });

    it("keeps panning on right-click in dimension mode", () => {
        const stage: StageStub = {
            draggable: vi.fn(),
        };
        const { result } = renderHook(() =>
            useStagePointerHandlers(
                createParams({
                    stageRef: createStageRef(stage),
                    isDimensionMode: true,
                })
            )
        );

        result.current.onMouseDown(createPointerEvent("Stage", 2));

        expect(setKonvaDragButtons).toHaveBeenCalledWith([1, 2]);
        expect(stage.draggable).toHaveBeenCalledWith(true);
    });

    it("treats touch-like events as left click", () => {
        const stage: StageStub = {
            draggable: vi.fn(),
        };
        const { result } = renderHook(() =>
            useStagePointerHandlers(
                createParams({
                    stageRef: createStageRef(stage),
                    isDimensionMode: true,
                })
            )
        );

        result.current.onMouseDown(createPointerEvent("Stage"));

        expect(setKonvaDragButtons).toHaveBeenCalledWith([0]);
        expect(stage.draggable).toHaveBeenCalledWith(false);
    });

    it("does not throw on touch-like event when stageRef.current is null", () => {
        const { result } = renderHook(() =>
            useStagePointerHandlers(
                createParams({
                    stageRef: createStageRef(null),
                    isDimensionMode: true,
                })
            )
        );

        expect(() => {
            result.current.onMouseDown(createPointerEvent("Stage"));
        }).not.toThrow();
        expect(setKonvaDragButtons).toHaveBeenCalledWith([0]);
    });

    it("forwards mouse move to dimension move handler", () => {
        const onMouseMoveDimension = vi.fn();
        const { result } = renderHook(() =>
            useStagePointerHandlers(createParams({ onMouseMoveDimension }))
        );

        result.current.onMouseMove();

        expect(onMouseMoveDimension).toHaveBeenCalledTimes(1);
    });

    it("forwards mouse up and restores idle policy in default mode", () => {
        const stage: StageStub = {
            draggable: vi.fn(),
        };
        const onMouseUpDimension = vi.fn();
        const { result } = renderHook(() =>
            useStagePointerHandlers(
                createParams({
                    stageRef: createStageRef(stage),
                    onMouseUpDimension,
                })
            )
        );

        result.current.onMouseUp();

        expect(onMouseUpDimension).toHaveBeenCalledTimes(1);
        expect(setKonvaDragButtons).toHaveBeenCalledWith([1, 2]);
        expect(stage.draggable).toHaveBeenCalledWith(true);
    });

    it("restores dimension-mode idle policy after right-click pan completes", () => {
        const stage: StageStub = {
            draggable: vi.fn(),
        };
        const { result } = renderHook(() =>
            useStagePointerHandlers(
                createParams({
                    stageRef: createStageRef(stage),
                    isDimensionMode: true,
                })
            )
        );

        result.current.onMouseDown(createPointerEvent("Stage", 2));
        result.current.onMouseUp();

        expect(setKonvaDragButtons).toHaveBeenLastCalledWith([0]);
        expect(stage.draggable).toHaveBeenLastCalledWith(false);
    });
});
