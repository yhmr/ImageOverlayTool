import { describe, expect, it } from "vitest";

import {
    resolveAppArgsFromEnv,
    resolveAppArgsFromSecondInstanceData,
    stripRuntimeOnlyAppArgs,
    toSyntheticCommandLine,
} from "@/main/bootstrap/appArgs";

describe("appArgs", () => {
    it("returns empty app args when env is missing", () => {
        expect(resolveAppArgsFromEnv({})).toEqual([]);
    });

    it("parses app args from IOT_APP_ARGS_JSON", () => {
        expect(
            resolveAppArgsFromEnv({
                IOT_APP_ARGS_JSON: JSON.stringify([
                    "startup",
                    "--images",
                    "sample.png",
                ]),
            })
        ).toEqual(["startup", "--images", "sample.png"]);
    });

    it("throws when IOT_APP_ARGS_JSON is invalid JSON", () => {
        expect(() =>
            resolveAppArgsFromEnv({
                IOT_APP_ARGS_JSON: "{invalid",
            })
        ).toThrow("IOT_APP_ARGS_JSON must be valid JSON.");
    });

    it("throws when IOT_APP_ARGS_JSON is not string array", () => {
        expect(() =>
            resolveAppArgsFromEnv({
                IOT_APP_ARGS_JSON: JSON.stringify({ startup: true }),
            })
        ).toThrow("IOT_APP_ARGS_JSON must be a JSON array of strings.");
    });

    it("parses app args from second-instance additionalData", () => {
        expect(
            resolveAppArgsFromSecondInstanceData({
                appArgs: ["control", "--set-opacity", "30"],
            })
        ).toEqual(["control", "--set-opacity", "30"]);
    });

    it("returns empty array when second-instance additionalData has no appArgs", () => {
        expect(resolveAppArgsFromSecondInstanceData({})).toEqual([]);
    });

    it("strips runtime-only app args from CLI route args", () => {
        expect(stripRuntimeOnlyAppArgs(["--e2e", "startup", "--images"])).toEqual(
            ["startup", "--images"]
        );
    });

    it("builds synthetic command line for dev and packaged mode", () => {
        expect(toSyntheticCommandLine(["startup", "--images"], false)).toEqual([
            "node",
            "index.js",
            "startup",
            "--images",
        ]);
        expect(toSyntheticCommandLine(["startup", "--images"], true)).toEqual([
            "ImageOverlayTool.exe",
            "startup",
            "--images",
        ]);
    });
});
