import { describe, expect, it } from "vitest";

import {
    isSupportedImageExtension,
    isSupportedImagePath,
} from "@/shared/constants/imageFormats";

describe("imageFormats", () => {
    it("validates extensions with and without leading dot", () => {
        expect(isSupportedImageExtension("")).toBe(false);
        expect(isSupportedImageExtension("   ")).toBe(false);
        expect(isSupportedImageExtension(".PNG")).toBe(true);
        expect(isSupportedImageExtension("jpeg")).toBe(true);
        expect(isSupportedImageExtension(".unknown")).toBe(false);
    });

    it("validates image paths by file extension", () => {
        expect(isSupportedImagePath("C:/tmp/file.png")).toBe(true);
        expect(isSupportedImagePath("C:\\tmp\\file.JPEG")).toBe(true);
        expect(isSupportedImagePath("C:/tmp/no-extension")).toBe(false);
        expect(isSupportedImagePath("C:/tmp/file.txt")).toBe(false);
    });
});
