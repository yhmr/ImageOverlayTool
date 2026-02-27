// @vitest-environment happy-dom
import { act, renderHook } from "@testing-library/react";
import type Konva from "konva";
import type { RefObject } from "react";
import { describe, expect, it, vi } from "vitest";

import { useImageAnchor } from "@/renderer/main-window/hooks/useImageAnchor";
import type { ImageSet } from "@/shared/types/ImageSet";

const createImageSet = (overrides: Partial<ImageSet> = {}): ImageSet => ({
    id: "img-1",
    path: "local-file://C:/tmp/sample.png",
    sourceType: "file",
    transparency: 0,
    rotation: 0,
    initAnchorPos: null,
    currentAnchorPos: null,
    ...overrides,
});

const createDragEvent = (x: number, y: number): Konva.KonvaEventObject<DragEvent> =>
    ({
        target: {
            x: vi.fn((value?: number) => (value === undefined ? x : undefined)),
            y: vi.fn((value?: number) => (value === undefined ? y : undefined)),
        },
    }) as unknown as Konva.KonvaEventObject<DragEvent>;

const createCircleRef = (
    x: number,
    y: number
): RefObject<Konva.Circle | null> =>
    ({
        current: {
            x: vi.fn(() => x),
            y: vi.fn(() => y),
        } as unknown as Konva.Circle,
    }) as RefObject<Konva.Circle | null>;

describe("useImageAnchor", () => {
    it("should handle drag start and end", () => {
        const imageSet = createImageSet({
            currentAnchorPos: {
                lt: { x: 0, y: 0 },
                rt: { x: 100, y: 0 },
                lb: { x: 0, y: 100 },
                rb: { x: 100, y: 100 },
            },
        });
        const onUpdateAnchor = vi.fn();

        const { result } = renderHook(() =>
            useImageAnchor({ imageSet, onUpdateAnchor })
        );

        const dragStartEvent = createDragEvent(10, 10);
        const dragEndEvent = createDragEvent(20, 20);

        act(() => {
            result.current.onDragStart(dragStartEvent);
        });

        act(() => {
            result.current.onDragEnd(dragEndEvent);
        });

        expect(onUpdateAnchor).toHaveBeenCalledWith({
            lt: { x: 10, y: 10 },
            rt: { x: 110, y: 10 },
            lb: { x: 10, y: 110 },
            rb: { x: 110, y: 110 },
        });

        expect(dragEndEvent.target.x).toHaveBeenCalledWith(0);
        expect(dragEndEvent.target.y).toHaveBeenCalledWith(0);
    });

    it("should handle circle drag end", () => {
        const imageSet = createImageSet();
        const onUpdateAnchor = vi.fn();
        const { result } = renderHook(() =>
            useImageAnchor({ imageSet, onUpdateAnchor })
        );

        const ltRef = createCircleRef(10, 10);
        const lbRef = createCircleRef(10, 110);
        const rtRef = createCircleRef(110, 10);
        const rbRef = createCircleRef(110, 110);

        const handler = result.current.onCircleDragEnd(
            ltRef,
            lbRef,
            rtRef,
            rbRef
        );

        act(() => {
            handler();
        });

        expect(onUpdateAnchor).toHaveBeenCalledWith({
            lt: { x: 10, y: 10 },
            lb: { x: 10, y: 110 },
            rt: { x: 110, y: 10 },
            rb: { x: 110, y: 110 },
        });
    });
});
