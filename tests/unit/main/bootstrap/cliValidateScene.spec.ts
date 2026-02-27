import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
    CliValidateSceneParseError,
    resolveCliValidateSceneRequest,
    validateSceneFromPath,
} from "@/main/bootstrap/cliValidateScene";
import { SCENE_FILE_VERSION } from "@/shared/types/SceneFile";

describe("cliValidateScene", () => {
    let tempDir: string;
    let imagePath: string;
    let validScenePath: string;
    let warningScenePath: string;
    let missingImageScenePath: string;

    beforeEach(() => {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "iot-validate-scene-"));
        imagePath = path.join(tempDir, "sample.png");
        validScenePath = path.join(tempDir, "valid.scene.json");
        warningScenePath = path.join(tempDir, "warning.scene.json");
        missingImageScenePath = path.join(tempDir, "missing-image.scene.json");

        fs.writeFileSync(imagePath, "png");
        fs.writeFileSync(
            validScenePath,
            JSON.stringify({
                version: SCENE_FILE_VERSION,
                images: [{ source: "./sample.png" }],
            })
        );
        fs.writeFileSync(
            warningScenePath,
            JSON.stringify({
                version: SCENE_FILE_VERSION,
                window: {
                    alwaysOnTop: false,
                    clickThrough: true,
                },
                images: [{ source: "./sample.png" }],
            })
        );
        fs.writeFileSync(
            missingImageScenePath,
            JSON.stringify({
                version: SCENE_FILE_VERSION,
                images: [{ source: "./missing.png" }],
            })
        );
    });

    afterEach(() => {
        fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it("returns null when --validate-scene is not specified", () => {
        expect(resolveCliValidateSceneRequest(["node", "index.js"], false)).toBeNull();
    });

    it("parses --validate-scene <path> with default text format", () => {
        expect(
            resolveCliValidateSceneRequest(
                ["node", "index.js", "--validate-scene", validScenePath],
                false
            )
        ).toEqual({
            scenePath: path.resolve(validScenePath),
            format: "text",
        });
    });

    it("parses --validate-scene=<path> with json format", () => {
        expect(
            resolveCliValidateSceneRequest(
                [
                    "node",
                    "index.js",
                    `--validate-scene=${validScenePath}`,
                    "--format",
                    "json",
                ],
                false
            )
        ).toEqual({
            scenePath: path.resolve(validScenePath),
            format: "json",
        });
    });

    it("throws parse error when scene path is missing", () => {
        let caught: unknown;
        try {
            resolveCliValidateSceneRequest(
                ["node", "index.js", "--validate-scene"],
                false
            );
        } catch (error) {
            caught = error;
        }

        expect(caught).toBeInstanceOf(CliValidateSceneParseError);
        expect(caught).toMatchObject({
            code: "VALIDATE_SCENE_PATH_REQUIRED",
            formatHint: "text",
        });
    });

    it("keeps json format hint when path is missing", () => {
        let caught: unknown;
        try {
            resolveCliValidateSceneRequest(
                ["node", "index.js", "--format", "json", "--validate-scene"],
                false
            );
        } catch (error) {
            caught = error;
        }

        expect(caught).toBeInstanceOf(CliValidateSceneParseError);
        expect(caught).toMatchObject({
            code: "VALIDATE_SCENE_PATH_REQUIRED",
            formatHint: "json",
        });
    });

    it("throws parse error when format is unknown", () => {
        let caught: unknown;
        try {
            resolveCliValidateSceneRequest(
                [
                    "node",
                    "index.js",
                    "--validate-scene",
                    validScenePath,
                    "--format",
                    "yaml",
                ],
                false
            );
        } catch (error) {
            caught = error;
        }

        expect(caught).toBeInstanceOf(CliValidateSceneParseError);
        expect(caught).toMatchObject({
            code: "VALIDATE_SCENE_UNKNOWN_FORMAT",
            formatHint: "text",
        });
    });

    it("validates scene successfully", () => {
        const result = validateSceneFromPath(validScenePath);
        expect(result.scenePath).toBe(path.resolve(validScenePath));
        expect(result.resolvedScene.version).toBe(SCENE_FILE_VERSION);
        expect(result.resolvedScene.images).toHaveLength(1);
        expect(result.warnings).toEqual([]);
    });

    it("returns dependency warning when clickThrough requires alwaysOnTop", () => {
        const result = validateSceneFromPath(warningScenePath);
        expect(result.warnings[0]).toContain("window.clickThrough is ignored");
    });

    it("throws validation error when scene includes missing image path", () => {
        expect(() => validateSceneFromPath(missingImageScenePath)).toThrow(
            "Scene image file not found"
        );
    });
});
