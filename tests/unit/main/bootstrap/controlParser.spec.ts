import { describe, expect, it } from "vitest";

import { parseControlCommand } from "@/main/bootstrap/controlParser";

describe("controlParser", () => {
    it("parses control set-opacity command", () => {
        expect(
            parseControlCommand(
                ["node", "index.js", "control", "--set-opacity", "30"],
                false
            )
        ).toEqual({
            kind: "set-opacity",
            opacity: 0.3,
        });
    });

    it("parses add-image with optional opacity", () => {
        expect(
            parseControlCommand(
                [
                    "node",
                    "index.js",
                    "control",
                    "--add-image",
                    "sample.png",
                    "--opacity",
                    "50",
                ],
                false
            )
        ).toEqual({
            kind: "add-image",
            imagePath: "sample.png",
            opacity: 0.5,
        });
    });

    it("returns null for startup subcommand", () => {
        expect(
            parseControlCommand(
                ["node", "index.js", "startup", "--images", "a.png"],
                false
            )
        ).toBeNull();
    });

    it("rejects flat control command without control subcommand", () => {
        expect(() =>
            parseControlCommand(
                ["node", "index.js", "--set-opacity", "30"],
                false
            )
        ).toThrow('Control commands require the "control" subcommand.');
    });

    it("rejects control subcommand without command option", () => {
        expect(() =>
            parseControlCommand(["node", "index.js", "control"], false)
        ).toThrow("control subcommand requires a command option.");
    });

    it("rejects --opacity when --add-image is not used", () => {
        expect(() =>
            parseControlCommand(
                [
                    "node",
                    "index.js",
                    "control",
                    "--set-opacity",
                    "30",
                    "--opacity",
                    "40",
                ],
                false
            )
        ).toThrow("--opacity can only be used with --add-image.");
    });
});
