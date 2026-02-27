import { describe, expect, it } from "vitest";

import { parseStartupArgs } from "@/main/bootstrap/startupParser";

describe("startupParser", () => {
    it("parses startup subcommand options", () => {
        expect(
            parseStartupArgs(
                [
                    "node",
                    "index.js",
                    "startup",
                    "--images",
                    "a.png",
                    "b.png",
                    "--opacity",
                    "50",
                    "--position",
                    "120,80",
                    "--size",
                    "1440,900",
                    "--always-on-top",
                    "--click-through",
                    "--fullscreen",
                    "--silent",
                    "--minimize",
                ],
                false
            )
        ).toEqual({
            images: ["a.png", "b.png"],
            opacity: 50,
            position: { x: 120, y: 80 },
            size: { width: 1440, height: 900 },
            alwaysOnTop: true,
            clickThrough: true,
            fullscreen: true,
            silent: true,
            minimize: true,
        });
    });

    it("accepts positional path without explicit subcommand", () => {
        expect(
            parseStartupArgs(["node", "index.js", "sample.scene.json"], false)
        ).toEqual({
            images: [],
            positionalPath: "sample.scene.json",
            alwaysOnTop: false,
            clickThrough: false,
            fullscreen: false,
            silent: false,
            minimize: false,
        });
    });

    it("rejects control subcommand", () => {
        expect(() =>
            parseStartupArgs(
                ["node", "index.js", "control", "--set-opacity", "30"],
                false
            )
        ).toThrow("control subcommand cannot be used with startup options.");
    });

    it("rejects flat startup options without startup subcommand", () => {
        expect(() =>
            parseStartupArgs(["node", "index.js", "--images", "a.png"], false)
        ).toThrow('Startup options require the "startup" subcommand.');
    });

    it("ignores control tokens in startup parser without explicit subcommand", () => {
        expect(
            parseStartupArgs(["node", "index.js", "--set-opacity", "30"], false)
        ).toEqual({
            images: [],
            alwaysOnTop: false,
            clickThrough: false,
            fullscreen: false,
            silent: false,
            minimize: false,
        });
    });

    it("ignores unknown options without explicit subcommand", () => {
        expect(
            parseStartupArgs(["node", "index.js", "--playwright-flag"], false)
        ).toEqual({
            images: [],
            alwaysOnTop: false,
            clickThrough: false,
            fullscreen: false,
            silent: false,
            minimize: false,
        });
    });

    it("ignores ambiguous non-path tokens after unknown options", () => {
        expect(
            parseStartupArgs(
                ["node", "index.js", "--runner-id", "worker-1"],
                false
            )
        ).toEqual({
            images: [],
            alwaysOnTop: false,
            clickThrough: false,
            fullscreen: false,
            silent: false,
            minimize: false,
        });
    });

    it("keeps path-like positional token when mixed with unknown options", () => {
        expect(
            parseStartupArgs(
                ["node", "index.js", "--runner-id", "./scene/sample.iot"],
                false
            )
        ).toEqual({
            images: [],
            positionalPath: "./scene/sample.iot",
            alwaysOnTop: false,
            clickThrough: false,
            fullscreen: false,
            silent: false,
            minimize: false,
        });
    });

    it("accepts global non-interactive option under startup subcommand", () => {
        expect(
            parseStartupArgs(
                [
                    "node",
                    "index.js",
                    "startup",
                    "--non-interactive",
                    "--images",
                    "a.png",
                ],
                false
            )
        ).toEqual({
            images: ["a.png"],
            alwaysOnTop: false,
            clickThrough: false,
            fullscreen: false,
            silent: false,
            minimize: false,
        });
    });
});
