import { describe, it, expect } from "vitest";
import {
    toLocalFileUrl,
    fromLocalFileUrl,
} from "@/shared/utils/localFileUrl";

describe("localFileUrl", () => {
    describe("toLocalFileUrl", () => {
        it("converts forward-slash path to local-file:// URL", () => {
            expect(toLocalFileUrl("C:/tmp/image.png")).toBe(
                "local-file://C:/tmp/image.png"
            );
        });

        it("converts backslash path to local-file:// URL with forward slashes", () => {
            expect(toLocalFileUrl("C:\\tmp\\image.png")).toBe(
                "local-file://C:/tmp/image.png"
            );
        });

        it("handles empty path", () => {
            expect(toLocalFileUrl("")).toBe("local-file://");
        });
    });

    describe("fromLocalFileUrl", () => {
        it("parses local-file:// URL with drive letter", () => {
            expect(fromLocalFileUrl("local-file://C:/tmp/image.png")).toBe(
                "C:/tmp/image.png"
            );
        });

        it("parses local-file:// URL with leading slash before drive letter", () => {
            expect(fromLocalFileUrl("local-file:///C:/tmp/image.png")).toBe(
                "C:/tmp/image.png"
            );
        });

        it("parses local-file:// URL with colonless drive letter", () => {
            expect(fromLocalFileUrl("local-file://C/tmp/image.png")).toBe(
                "C:/tmp/image.png"
            );
        });

        it("returns null for non local-file:// strings", () => {
            expect(fromLocalFileUrl("https://example.com")).toBeNull();
            expect(fromLocalFileUrl("file:///C:/tmp/image.png")).toBeNull();
            expect(fromLocalFileUrl("C:/tmp/image.png")).toBeNull();
        });

        it("returns null for empty or non-string input", () => {
            expect(fromLocalFileUrl("")).toBeNull();
            expect(fromLocalFileUrl(null as unknown as string)).toBeNull();
            expect(fromLocalFileUrl(undefined as unknown as string)).toBeNull();
        });

        it("round-trips with toLocalFileUrl for forward-slash paths", () => {
            const original = "C:/Users/test/images/photo.png";
            expect(fromLocalFileUrl(toLocalFileUrl(original))).toBe(original);
        });
    });
});
