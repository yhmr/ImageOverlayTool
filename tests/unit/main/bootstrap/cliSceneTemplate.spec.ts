import { describe, expect, it } from "vitest";

import {
    CliSceneTemplateParseError,
    renderSceneTemplate,
    resolveCliSceneTemplateRequest,
} from "@/main/bootstrap/cliSceneTemplate";
import { parseSceneFile } from "@/main/repositories/sceneSchema";
import { SCENE_FILE_VERSION } from "@/shared/types/SceneFile";

describe("cliSceneTemplate", () => {
    it("returns null when --scene-template is not specified", () => {
        expect(resolveCliSceneTemplateRequest(["node", "index.js"], false)).toBeNull();
    });

    it("parses --scene-template v1 with default format", () => {
        expect(
            resolveCliSceneTemplateRequest(
                ["node", "index.js", "--scene-template", "v1"],
                false
            )
        ).toEqual({
            version: "v1",
            format: "text",
        });
    });

    it("parses --scene-template=v1 and --format json", () => {
        expect(
            resolveCliSceneTemplateRequest(
                ["node", "index.js", "--scene-template=v1", "--format", "json"],
                false
            )
        ).toEqual({
            version: "v1",
            format: "json",
        });
    });

    it("throws when scene-template version is missing", () => {
        let caught: unknown;
        try {
            resolveCliSceneTemplateRequest(
                ["node", "index.js", "--scene-template"],
                false
            );
        } catch (error) {
            caught = error;
        }

        expect(caught).toBeInstanceOf(CliSceneTemplateParseError);
        expect(caught).toMatchObject({
            code: "SCENE_TEMPLATE_VERSION_REQUIRED",
            formatHint: "text",
        });
    });

    it("throws when scene-template version is unknown", () => {
        let caught: unknown;
        try {
            resolveCliSceneTemplateRequest(
                ["node", "index.js", "--scene-template", "v2"],
                false
            );
        } catch (error) {
            caught = error;
        }

        expect(caught).toBeInstanceOf(CliSceneTemplateParseError);
        expect(caught).toMatchObject({
            code: "SCENE_TEMPLATE_UNKNOWN_VERSION",
            formatHint: "text",
        });
    });

    it("throws unknown format with json hint preservation", () => {
        let caught: unknown;
        try {
            resolveCliSceneTemplateRequest(
                [
                    "node",
                    "index.js",
                    "--scene-template",
                    "v1",
                    "--format",
                    "yaml",
                ],
                false
            );
        } catch (error) {
            caught = error;
        }

        expect(caught).toBeInstanceOf(CliSceneTemplateParseError);
        expect(caught).toMatchObject({
            code: "SCENE_TEMPLATE_UNKNOWN_FORMAT",
            formatHint: "text",
        });
    });

    it("renders valid scene template v1 json", () => {
        const text = renderSceneTemplate({ version: "v1", format: "text" });
        const template = JSON.parse(text) as unknown;
        const scene = parseSceneFile(template);

        expect(scene.version).toBe(SCENE_FILE_VERSION);
        expect(scene.images).toEqual([]);
        expect(scene.window).toEqual({
            color: "#00000000",
            alwaysOnTop: false,
            clickThrough: false,
            showWindowFrame: false,
        });
        expect(scene.unitFactor).toBe(1);
        expect(scene.unit).toBe("um");
        expect(scene.canvas).toEqual({ x: 0, y: 0, scale: 1 });
        expect(scene.imagePathAliases).toEqual({
            assets: "./images",
            shared: "D:/overlay-assets",
        });
        expect(scene.dimensionLines).toEqual([]);
    });
});
