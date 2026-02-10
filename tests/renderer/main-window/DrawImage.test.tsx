/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { DrawImage } from "@/renderer/main-window/components/DrawImage";
import type { ImageSet } from "@/shared/types/ImageSet";

const mockUseImage = vi.fn();

vi.mock("use-image", () => ({
    default: (...args: unknown[]) => mockUseImage(...args),
}));

vi.mock("@/renderer/main-window/components/PerspectiveImage", () => ({
    PerspectiveImage: ({ imageSet }: { imageSet: ImageSet }) => (
        <div data-testid={`perspective-${imageSet.id}`} />
    ),
}));

const baseImageSet: ImageSet = {
    id: "image-1",
    path: "test.png",
    transparency: 0,
    rotation: 0,
    initAnchorPos: null,
    currentAnchorPos: null,
    locked: false,
};

describe("DrawImage", () => {
    beforeEach(() => {
        mockUseImage.mockReset();
    });

    it("initializes anchors only when image exists and anchors are missing", () => {
        const image = { width: 120, height: 80 } as HTMLImageElement;
        mockUseImage.mockReturnValue([image]);

        const onInitImage = vi.fn();
        const onSelect = vi.fn();

        const { rerender } = render(
            <DrawImage
                imageSet={baseImageSet}
                onInitImage={onInitImage}
                onSelect={onSelect}
            />
        );

        expect(onInitImage).toHaveBeenCalledTimes(1);
        expect(onInitImage).toHaveBeenCalledWith(image);

        rerender(
            <DrawImage
                imageSet={{ ...baseImageSet, rotation: 45 }}
                onInitImage={onInitImage}
                onSelect={onSelect}
            />
        );

        expect(onInitImage).toHaveBeenCalledTimes(1);
    });

    it("does not initialize when anchors already exist", () => {
        const image = { width: 120, height: 80 } as HTMLImageElement;
        mockUseImage.mockReturnValue([image]);

        const onInitImage = vi.fn();

        render(
            <DrawImage
                imageSet={{
                    ...baseImageSet,
                    initAnchorPos: {
                        lt: { x: 0, y: 0 },
                        lb: { x: 0, y: 80 },
                        rt: { x: 120, y: 0 },
                        rb: { x: 120, y: 80 },
                    },
                    currentAnchorPos: {
                        lt: { x: 0, y: 0 },
                        lb: { x: 0, y: 80 },
                        rt: { x: 120, y: 0 },
                        rb: { x: 120, y: 80 },
                    },
                }}
                onInitImage={onInitImage}
                onSelect={() => {}}
            />
        );

        expect(onInitImage).not.toHaveBeenCalled();
    });
});

