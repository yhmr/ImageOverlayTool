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
});
