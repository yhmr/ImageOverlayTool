// @vitest-environment happy-dom
import { renderHook, act } from "@testing-library/react";
import { useStageControls } from "@/renderer/hooks/useStageControls";
import { describe, it, expect, vi, afterEach } from "vitest";

describe("useStageControls", () => {
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
        const mockStage = {
            scaleX: vi.fn(() => 1),
            x: vi.fn(() => 0),
            y: vi.fn(() => 0),
            getPointerPosition: vi.fn(() => ({ x: 100, y: 100 })),
            scale: vi.fn(),
            position: vi.fn(),
        } as any;

        const { result } = renderHook(() =>
            useStageControls({ current: mockStage }, onUpdate)
        );

        const preventDefault = vi.fn();
        const event = { evt: { preventDefault, deltaY: -100 } } as any; // Zoom In

        act(() => {
            result.current.onWheel(event);
        });

        expect(preventDefault).toHaveBeenCalled();
        expect(onUpdate).toHaveBeenCalled();
        // Check new scale > 1
        expect(onUpdate.mock.calls[0][0].scale).toBeGreaterThan(1);
    });

    it("should no-op wheel handling when stage ref is null", () => {
        const { result } = renderHook(() => useStageControls({ current: null }));
        const preventDefault = vi.fn();

        act(() => {
            result.current.onWheel({ evt: { preventDefault, deltaY: -1 } } as any);
        });

        expect(preventDefault).toHaveBeenCalledTimes(1);
    });

    it("should no-op when pointer position is unavailable", () => {
        const onUpdate = vi.fn();
        const mockStage = {
            scaleX: vi.fn(() => 1),
            x: vi.fn(() => 0),
            y: vi.fn(() => 0),
            getPointerPosition: vi.fn(() => null),
            scale: vi.fn(),
            position: vi.fn(),
        } as any;

        const { result } = renderHook(() =>
            useStageControls({ current: mockStage }, onUpdate)
        );

        act(() => {
            result.current.onWheel({
                evt: { preventDefault: vi.fn(), deltaY: -100 },
            } as any);
        });

        expect(onUpdate).not.toHaveBeenCalled();
        expect(mockStage.scale).not.toHaveBeenCalled();
        expect(mockStage.position).not.toHaveBeenCalled();
    });

    it("should zoom out and update stage directly when onUpdate is not provided", () => {
        const mockStage = {
            scaleX: vi.fn(() => 2),
            x: vi.fn(() => 10),
            y: vi.fn(() => 20),
            getPointerPosition: vi.fn(() => ({ x: 100, y: 120 })),
            scale: vi.fn(),
            position: vi.fn(),
        } as any;

        const { result } = renderHook(() =>
            useStageControls({ current: mockStage }, undefined)
        );

        act(() => {
            result.current.onWheel({
                evt: { preventDefault: vi.fn(), deltaY: 100 },
            } as any);
        });

        expect(mockStage.scale).toHaveBeenCalledTimes(1);
        expect(mockStage.position).toHaveBeenCalledTimes(1);
        const scaleArg = mockStage.scale.mock.calls[0][0];
        expect(scaleArg.x).toBeLessThan(2);
        expect(scaleArg.y).toBeLessThan(2);
    });
});
