import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { resolveStartupLaunchPlan } from "@/main/bootstrap/startupLaunch";
import { SCENE_FILE_VERSION } from "@/shared/types/SceneFile";

describe("resolveStartupLaunchPlan", () => {
    let tempDir: string;
    let imagePath: string;
    let scenePath: string;
    let projectPath: string;

    beforeEach(() => {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "iot-startup-"));
        imagePath = path.join(tempDir, "sample.png");
        projectPath = path.join(tempDir, "sample.iot");
        scenePath = path.join(tempDir, "default.scene.json");
        fs.writeFileSync(imagePath, "png");
        fs.writeFileSync(projectPath, "{}");
        fs.writeFileSync(
            scenePath,
            JSON.stringify({
                version: SCENE_FILE_VERSION,
                images: [{ source: "./sample.png" }],
            })
        );
    });

    afterEach(() => {
        fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it("resolves positional project file path", async () => {
        const plan = await resolveStartupLaunchPlan(
            ["node", "index.js", projectPath],
            false
        );

        expect(plan.filePath).toBe(path.resolve(projectPath));
        expect(plan.launchIntent).toBeUndefined();
    });

    it("applies window mode intent with positional project file path", async () => {
        const plan = await resolveStartupLaunchPlan(
            [
                "node",
                "index.js",
                projectPath,
                "--always-on-top",
                "--click-through",
            ],
            false
        );

        expect(plan.filePath).toBe(path.resolve(projectPath));
        expect(plan.launchIntent?.window).toEqual({
            alwaysOnTop: true,
            clickThrough: true,
        });
    });

    it("builds launch intent from --images and applies opacity/window flags", async () => {
        const plan = await resolveStartupLaunchPlan(
            [
                "node",
                "index.js",
                "--images",
                imagePath,
                "--opacity",
                "50",
                "--always-on-top",
                "--click-through",
            ],
            false
        );

        expect(plan.filePath).toBeUndefined();
        expect(plan.launchIntent?.window).toEqual({
            alwaysOnTop: true,
            clickThrough: true,
        });
        expect(plan.launchIntent?.images).toEqual([
            expect.objectContaining({
                path: path.resolve(imagePath),
                transparency: 0.5,
            }),
        ]);
        expect(plan.warnings).toEqual([]);
    });

    it("warns and disables click-through when always-on-top is not enabled", async () => {
        const plan = await resolveStartupLaunchPlan(
            ["node", "index.js", "--images", imagePath, "--click-through"],
            false
        );

        expect(plan.launchIntent?.window).toEqual({
            alwaysOnTop: false,
            clickThrough: false,
        });
        expect(plan.warnings[0]).toContain("window.clickThrough is ignored");
    });

    it("treats --scene as exclusive with state options", async () => {
        await expect(
            resolveStartupLaunchPlan(
                ["node", "index.js", "--scene", scenePath, "--always-on-top"],
                false
            )
        ).rejects.toThrow("--scene is exclusive");
    });

    it("treats positional scene file as exclusive with state options", async () => {
        await expect(
            resolveStartupLaunchPlan(
                ["node", "index.js", scenePath, "--fullscreen"],
                false
            )
        ).rejects.toThrow("Scene file input is exclusive");
    });

    it("resolves scene launch intent from --scene", async () => {
        const plan = await resolveStartupLaunchPlan(
            ["node", "index.js", "--scene", scenePath],
            false
        );

        expect(plan.filePath).toBeUndefined();
        expect(plan.launchIntent?.images).toHaveLength(1);
        expect(plan.launchIntent?.images[0].path).toBe(path.resolve(imagePath));
    });

    it("parses startup window options and silent flag", async () => {
        const plan = await resolveStartupLaunchPlan(
            [
                "node",
                "index.js",
                "--position",
                "120,80",
                "--size",
                "1440,900",
                "--fullscreen",
                "--silent",
                "--minimize",
            ],
            false
        );

        expect(plan.skipSplash).toBe(true);
        expect(plan.windowOptions).toEqual({
            position: { x: 120, y: 80 },
            size: { width: 1440, height: 900 },
            fullscreen: true,
            minimize: true,
        });
    });

    it("rejects invalid opacity values", async () => {
        await expect(
            resolveStartupLaunchPlan(
                ["node", "index.js", "--opacity", "180", "--images", imagePath],
                false
            )
        ).rejects.toThrow("--opacity must be between 0 and 100");
    });
});
