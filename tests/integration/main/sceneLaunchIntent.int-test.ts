import fs from "fs/promises";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
    CLICK_THROUGH_REQUIRES_ALWAYS_ON_TOP_WARNING,
    resolveLaunchIntentFromScene,
} from "@/main/repositories/launchIntent";
import { loadResolvedSceneFileFromPath } from "@/main/repositories/sceneLoader";
import { SCENE_FILE_VERSION } from "@/shared/types/SceneFile";

describe("Main integration: scene launch intent", () => {
    let tempRootDir: string;

    beforeEach(async () => {
        tempRootDir = await fs.mkdtemp(path.join(os.tmpdir(), "iot-int-scene-"));
    });

    afterEach(async () => {
        await fs.rm(tempRootDir, { recursive: true, force: true });
    });

    it("builds launch intent from resolved scene file", async () => {
        const imagePath = path.join(tempRootDir, "sample.png");
        const scenePath = path.join(tempRootDir, "default.scene.json");
        await fs.writeFile(imagePath, "png");
        await fs.writeFile(
            scenePath,
            JSON.stringify({
                version: SCENE_FILE_VERSION,
                window: {
                    color: "#11223344",
                    alwaysOnTop: true,
                    clickThrough: true,
                    showWindowFrame: true,
                },
                unitFactor: 2,
                unit: "mm",
                canvas: { x: 3, y: 5, scale: 1.5 },
                images: [{ id: "img-1", source: "./sample.png" }],
            }),
            "utf-8"
        );

        const resolvedScene = await loadResolvedSceneFileFromPath(scenePath);
        const result = resolveLaunchIntentFromScene(resolvedScene);

        expect(result.warnings).toEqual([]);
        expect(result.launchIntent.window).toEqual({
            color: "#11223344",
            alwaysOnTop: true,
            clickThrough: true,
            showWindowFrame: true,
        });
        expect(result.launchIntent.unitFactor).toBe(2);
        expect(result.launchIntent.unit).toBe("mm");
        expect(result.launchIntent.canvas).toEqual({ x: 3, y: 5, scale: 1.5 });
        expect(result.launchIntent.images[0]).toEqual(
            expect.objectContaining({
                id: "img-1",
                path: path.resolve(imagePath),
            })
        );
    });

    it("normalizes click-through and reports warning when alwaysOnTop is false", async () => {
        const imagePath = path.join(tempRootDir, "sample.png");
        const scenePath = path.join(tempRootDir, "warn.scene.json");
        await fs.writeFile(imagePath, "png");
        await fs.writeFile(
            scenePath,
            JSON.stringify({
                version: SCENE_FILE_VERSION,
                window: {
                    alwaysOnTop: false,
                    clickThrough: true,
                },
                images: [{ source: "./sample.png" }],
            }),
            "utf-8"
        );

        const resolvedScene = await loadResolvedSceneFileFromPath(scenePath);
        const result = resolveLaunchIntentFromScene(resolvedScene);

        expect(result.warnings).toEqual([
            CLICK_THROUGH_REQUIRES_ALWAYS_ON_TOP_WARNING,
        ]);
        expect(result.launchIntent.window).toEqual({
            color: undefined,
            alwaysOnTop: false,
            clickThrough: false,
            showWindowFrame: undefined,
        });
    });
});
