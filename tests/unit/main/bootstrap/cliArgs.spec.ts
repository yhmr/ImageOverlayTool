import { describe, expect, it } from "vitest";

import {
    isOptionToken,
    normalizeArgv,
    parseOpacityPercent,
    requireOptionValue,
} from "@/main/bootstrap/cliArgs";

describe("cliArgs", () => {
    it("normalizes argv for dev and packaged modes", () => {
        expect(normalizeArgv(["node", "index.js", "--foo"], false)).toEqual([
            "--foo",
        ]);
        expect(normalizeArgv(["ImageOverlayTool.exe", "--foo"], true)).toEqual([
            "--foo",
        ]);
    });

    it("detects option tokens", () => {
        expect(isOptionToken("--scene")).toBe(true);
        expect(isOptionToken("scene.json")).toBe(false);
    });

    it("returns option value and throws when missing", () => {
        expect(requireOptionValue(["--scene", "a.scene.json"], 0, "--scene")).toBe(
            "a.scene.json"
        );
        expect(() => requireOptionValue(["--scene"], 0, "--scene")).toThrow(
            "--scene requires a value."
        );
    });

    it("parses opacity percent in range 0..100", () => {
        expect(parseOpacityPercent("0", "--opacity")).toBe(0);
        expect(parseOpacityPercent("100", "--opacity")).toBe(100);
        expect(() => parseOpacityPercent("101", "--opacity")).toThrow(
            "--opacity must be between 0 and 100."
        );
    });
});
