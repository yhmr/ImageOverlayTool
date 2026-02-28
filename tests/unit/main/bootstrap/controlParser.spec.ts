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

    it("parses --wait-stable with default timeout", () => {
        expect(
            parseControlCommand(
                ["node", "index.js", "control", "--wait-stable"],
                false
            )
        ).toEqual({
            kind: "wait-stable",
            timeoutMs: 5000,
        });
    });

    it("parses --wait-stable with --timeout-ms", () => {
        expect(
            parseControlCommand(
                [
                    "node",
                    "index.js",
                    "control",
                    "--wait-stable",
                    "--timeout-ms",
                    "7000",
                ],
                false
            )
        ).toEqual({
            kind: "wait-stable",
            timeoutMs: 7000,
        });
    });

    it("accepts global non-interactive option", () => {
        expect(
            parseControlCommand(
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
            kind: "set-opacity",
            opacity: 0.3,
        });
    });

    it("rejects --timeout-ms unless --wait-stable is selected", () => {
        expect(() =>
            parseControlCommand(
                [
                    "node",
                    "index.js",
                    "control",
                    "--set-opacity",
                    "30",
                    "--timeout-ms",
                    "7000",
                ],
                false
            )
        ).toThrow("--timeout-ms can only be used with --wait-stable.");
    });

    it("parses --capture-window command", () => {
        expect(
            parseControlCommand(
                [
                    "node",
                    "index.js",
                    "control",
                    "--capture-window",
                    "capture.png",
                ],
                false
            )
        ).toEqual({
            kind: "capture-window",
            outputPath: "capture.png",
        });
    });

    it("parses --save-stage command", () => {
        expect(
            parseControlCommand(
                [
                    "node",
                    "index.js",
                    "control",
                    "--save-stage",
                    "stage.png",
                ],
                false
            )
        ).toEqual({
            kind: "save-stage",
            outputPath: "stage.png",
        });
    });

    it("parses --switch-scene command", () => {
        expect(
            parseControlCommand(
                [
                    "node",
                    "index.js",
                    "control",
                    "--switch-scene",
                    "sample.scene.json",
                ],
                false
            )
        ).toEqual({
            kind: "switch-scene",
            scenePath: "sample.scene.json",
        });
    });

    it("rejects unknown second-instance option", () => {
        expect(() =>
            parseControlCommand(
                [
                    "node",
                    "index.js",
                    "control",
                    "--set-opacity",
                    "30",
                    "--invalid-option",
                ],
                false
            )
        ).toThrow("Unknown second-instance option: --invalid-option");
    });

    it("rejects positional arguments in control subcommand", () => {
        expect(() =>
            parseControlCommand(
                [
                    "node",
                    "index.js",
                    "control",
                    "--set-opacity",
                    "30",
                    "unexpected-positional",
                ],
                false
            )
        ).toThrow(
            "Positional arguments are not supported with second-instance commands."
        );
    });

    it("rejects missing output path for --capture-window", () => {
        expect(() =>
            parseControlCommand(
                ["node", "index.js", "control", "--capture-window"],
                false
            )
        ).toThrow("--capture-window requires a value.");
    });

    it("rejects missing output path for --save-stage", () => {
        expect(() =>
            parseControlCommand(
                ["node", "index.js", "control", "--save-stage"],
                false
            )
        ).toThrow("--save-stage requires a value.");
    });

    it("rejects multiple control commands in one invocation", () => {
        expect(() =>
            parseControlCommand(
                [
                    "node",
                    "index.js",
                    "control",
                    "--set-opacity",
                    "30",
                    "--capture-window",
                    "capture.png",
                ],
                false
            )
        ).toThrow("Only one second-instance command can be specified at a time.");
    });

    it("rejects invalid --timeout-ms value", () => {
        expect(() =>
            parseControlCommand(
                [
                    "node",
                    "index.js",
                    "control",
                    "--wait-stable",
                    "--timeout-ms",
                    "0",
                ],
                false
            )
        ).toThrow("--timeout-ms must be a positive integer.");
    });

    it("rejects too large --timeout-ms value", () => {
        expect(() =>
            parseControlCommand(
                [
                    "node",
                    "index.js",
                    "control",
                    "--wait-stable",
                    "--timeout-ms",
                    "120001",
                ],
                false
            )
        ).toThrow("--timeout-ms must be less than or equal to 120000.");
    });

    it("rejects control subcommand with only global options", () => {
        expect(() =>
            parseControlCommand(
                ["node", "index.js", "control", "--non-interactive"],
                false
            )
        ).toThrow("control subcommand requires a command option.");
    });

});
