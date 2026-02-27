import { describe, expect, it } from "vitest";

import { resolveCliRuntimeOptions } from "@/main/bootstrap/cliRuntimeOptions";

describe("cliRuntimeOptions", () => {
    it("defaults to interactive mode", () => {
        expect(
            resolveCliRuntimeOptions(
                ["node", "index.js", "control", "--set-opacity", "30"],
                false
            )
        ).toEqual({
            interactive: true,
        });
    });

    it("resolves non-interactive mode when --non-interactive is provided", () => {
        expect(
            resolveCliRuntimeOptions(
                [
                    "node",
                    "index.js",
                    "control",
                    "--non-interactive",
                    "--set-opacity",
                    "30",
                ],
                false
            )
        ).toEqual({
            interactive: false,
        });
    });

    it("resolves non-interactive mode in packaged argv shape", () => {
        expect(
            resolveCliRuntimeOptions(
                [
                    "ImageOverlayTool.exe",
                    "control",
                    "--non-interactive",
                    "--set-opacity",
                    "30",
                ],
                true
            )
        ).toEqual({
            interactive: false,
        });
    });
});
