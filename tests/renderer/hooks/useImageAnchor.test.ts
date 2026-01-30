// @vitest-environment happy-dom
import { renderHook, act } from "@testing-library/react";
import { useImageAnchor } from "@/renderer/hooks/useImageAnchor";
import { describe, it, expect, vi } from "vitest";
import { ImageSet } from "@/renderer/../shared/types/ImageSet";
import Konva from "konva";

describe("useImageAnchor", () => {
    it("should handle drag start and end", () => {
        const imageSet = {
            current_anchor_pos: {
                lt: { x: 0, y: 0 },
                rt: { x: 100, y: 0 },
                lb: { x: 0, y: 100 },
                rb: { x: 100, y: 100 },
            },
        } as unknown as ImageSet;
        const onUpdateAnchor = vi.fn();

        const { result } = renderHook(() =>
            useImageAnchor({ imageSet, onUpdateAnchor })
        );

        // Mock Drag Events
        const dragStartEvent = {
            target: { x: () => 10, y: () => 10 },
        } as unknown as Konva.KonvaEventObject<DragEvent>;

        const xMock = vi.fn((val?: number) => {
            if (val !== undefined) return;
            return 20;
        });
        const yMock = vi.fn((val?: number) => {
            if (val !== undefined) return;
            return 20;
        });

        const dragEndEvent = {
            target: {
                x: xMock,
                y: yMock,
            },
        } as unknown as Konva.KonvaEventObject<DragEvent>;

        act(() => {
            result.current.onDragStart(dragStartEvent);
        });

        act(() => {
            result.current.onDragEnd(dragEndEvent);
        });

        // Verify update
        expect(onUpdateAnchor).toHaveBeenCalledWith({
            lt: { x: 10, y: 10 },
            rt: { x: 110, y: 10 },
            lb: { x: 10, y: 110 },
            rb: { x: 110, y: 110 },
        });

        // Verify position reset
        expect(xMock).toHaveBeenCalledWith(0);
        expect(yMock).toHaveBeenCalledWith(0);
    });
});

