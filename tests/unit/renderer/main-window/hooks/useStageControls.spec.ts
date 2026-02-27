// @vitest-environment happy-dom
import { renderHook, act } from "@testing-library/react";
import type Konva from "konva";
import { useStageControls } from "@/renderer/main-window/hooks/useStageControls";
import { describe, it, expect, vi, afterEach } from "vitest";

describe("useStageControls", () => {
    type StageStub = {
        scaleX: () => number;
        x: () => number;
        y: () => number;
        getPointerPosition: () => { x: number; y: number } | null;
        scale: (value: { x: number; y: number }) => void;
        position: (value: { x: number; y: number }) => void;
    };

    const toKonvaStage = (stage: StageStub): Konva.Stage =>
        stage as unknown as Konva.Stage;

    const createWheelEvent = (
        deltaY: number,
        preventDefault = vi.fn()
    ): Konva.KonvaEventObject<WheelEvent> =>
        ({
            evt: { preventDefault, deltaY } as unknown as WheelEvent,
        }) as unknown as Konva.KonvaEventObject<WheelEvent>;

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("should resize based on container", () => {
        // Mock container
        const container = document.createElement("div");
        vi.spyOn(container, "offsetWidth", "get").mockReturnValue(500);
        vi.spyOn(container, "offsetHeight", "get").mockReturnValue(400);
        vi.spyOn(document, "querySelector").mockReturnValue(container);

        const { result } = renderHook(() =>
            useStageControls({ current: null })
        );

        expect(result.current.stageSize).toEqual({ width: 500, height: 400 });
    });

    it("should handle wheel zoom", () => {
        const onUpdate = vi.fn();
        const mockStage: StageStub = {
            scaleX: vi.fn(() => 1),
            x: vi.fn(() => 0),
            y: vi.fn(() => 0),
            getPointerPosition: vi.fn(() => ({ x: 100, y: 100 })),
            scale: vi.fn(),
            position: vi.fn(),
        };

        const { result } = renderHook(() =>
            useStageControls({ current: toKonvaStage(mockStage) }, onUpdate)
        );

        const preventDefault = vi.fn();
        const event = createWheelEvent(-100, preventDefault); // Zoom In

        act(() => {
            result.current.onWheel(event);
        });

        expect(preventDefault).toHaveBeenCalled();
        expect(onUpdate).toHaveBeenCalled();
        const onUpdateCall = vi.mocked(onUpdate).mock.lastCall;
        if (!onUpdateCall) {
            throw new Error("onUpdate should receive latest stage state");
        }
        const [stageUpdate] = onUpdateCall as [{ scale: number }];
        expect(stageUpdate.scale).toBeGreaterThan(1);
    });

    it("should no-op wheel handling when stage ref is null", () => {
        const { result } = renderHook(() => useStageControls({ current: null }));
        const preventDefault = vi.fn();

        act(() => {
            result.current.onWheel(createWheelEvent(-1, preventDefault));
        });

        expect(preventDefault).toHaveBeenCalledTimes(1);
    });

    it("should no-op when pointer position is unavailable", () => {
        const onUpdate = vi.fn();
        const mockStage: StageStub = {
            scaleX: vi.fn(() => 1),
            x: vi.fn(() => 0),
            y: vi.fn(() => 0),
            getPointerPosition: vi.fn(() => null),
            scale: vi.fn(),
            position: vi.fn(),
        };

        const { result } = renderHook(() =>
            useStageControls({ current: toKonvaStage(mockStage) }, onUpdate)
        );

        act(() => {
            result.current.onWheel(createWheelEvent(-100));
        });

        expect(onUpdate).not.toHaveBeenCalled();
        expect(mockStage.scale).not.toHaveBeenCalled();
        expect(mockStage.position).not.toHaveBeenCalled();
    });

    it("should zoom out and update stage directly when onUpdate is not provided", () => {
        const mockStage: StageStub = {
            scaleX: vi.fn(() => 2),
            x: vi.fn(() => 10),
            y: vi.fn(() => 20),
            getPointerPosition: vi.fn(() => ({ x: 100, y: 120 })),
            scale: vi.fn(),
            position: vi.fn(),
        };

        const { result } = renderHook(() =>
            useStageControls({ current: toKonvaStage(mockStage) }, undefined)
        );

        act(() => {
            result.current.onWheel(createWheelEvent(100));
        });

        expect(mockStage.scale).toHaveBeenCalledTimes(1);
        expect(mockStage.position).toHaveBeenCalledTimes(1);
        const scaleCall = vi.mocked(mockStage.scale).mock.lastCall;
        if (!scaleCall) {
            throw new Error("stage scale should be updated");
        }
        const [scaleArg] = scaleCall as [{ x: number; y: number }];
        expect(scaleArg.x).toBeLessThan(2);
        expect(scaleArg.y).toBeLessThan(2);
    });
});
