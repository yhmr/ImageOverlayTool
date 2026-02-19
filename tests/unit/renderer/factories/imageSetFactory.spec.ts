import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUuidGenerate = vi.hoisted(() => vi.fn(() => "factory-uuid"));

vi.mock("uuidjs", () => ({
    default: {
        generate: mockUuidGenerate,
    },
}));

import {
    createEmptyImageSet,
    createImageSet,
    createImageSetFromLocalFile,
    toLocalFileUrl,
} from "@/renderer/factories/imageSetFactory";

describe("imageSetFactory", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("createEmptyImageSet should return default image set", () => {
        const imageSet = createEmptyImageSet();

        expect(imageSet).toEqual({
            id: "factory-uuid",
            path: "",
            sourceType: "file",
            transparency: 0,
            rotation: 0,
            initAnchorPos: null,
            currentAnchorPos: null,
            locked: false,
            visible: true,
            filters: {
                binarization: { enabled: false, threshold: 128 },
                hsv: { enabled: false, h: 0, s: 0, v: 0 },
            },
        });
    });

    it("createImageSetFromLocalFile should normalize local path", () => {
        const imageSet = createImageSetFromLocalFile("C:\\tmp\\sample.png");

        expect(imageSet.path).toBe("local-file://C:/tmp/sample.png");
        expect(imageSet.locked).toBe(false);
    });

    it("createImageSet should apply overrides", () => {
        const imageSet = createImageSet({
            id: "custom-id",
            path: "custom-path",
            transparency: 35,
            rotation: 15,
            locked: true,
        });

        expect(imageSet.id).toBe("custom-id");
        expect(imageSet.path).toBe("custom-path");
        expect(imageSet.transparency).toBe(35);
        expect(imageSet.rotation).toBe(15);
        expect(imageSet.locked).toBe(true);
    });

    it("toLocalFileUrl should convert separators", () => {
        expect(toLocalFileUrl("C:\\foo\\bar.jpg")).toBe(
            "local-file://C:/foo/bar.jpg"
        );
    });
});
