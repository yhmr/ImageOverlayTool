import fs from "fs/promises";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("electron", () => ({
    app: {
        isPackaged: true,
        getPath: () => process.cwd(),
    },
}));

import { ProjectRepository } from "@/main/repositories/ProjectRepository";
import { ProjectService } from "@/main/services/ProjectService";
import type { ImageSet } from "@/shared/types/ImageSet";
import type { ProjectFile } from "@/shared/types/ProjectFile";

describe("Main integration: project persistence", () => {
    let tempRootDir: string;

    beforeEach(async () => {
        tempRootDir = await fs.mkdtemp(path.join(os.tmpdir(), "iot-int-"));
    });

    afterEach(async () => {
        await fs.rm(tempRootDir, { recursive: true, force: true });
    });

    it("materializes cache images and round-trips through repository", async () => {
        const repository = new ProjectRepository();
        const service = new ProjectService();

        const projectDir = path.join(tempRootDir, "project");
        const cacheDir = path.join(tempRootDir, "cache");
        await fs.mkdir(projectDir, { recursive: true });
        await fs.mkdir(cacheDir, { recursive: true });

        const sourceCacheImagePath = path.join(cacheDir, "capture.png");
        const sourceContent = Buffer.from("integration-cache-image");
        await fs.writeFile(sourceCacheImagePath, sourceContent);

        const projectFilePath = path.join(projectDir, "sample.iot");
        const replacements = await service.materializeCacheImages(
            projectFilePath,
            [sourceCacheImagePath, sourceCacheImagePath, ""]
        );

        expect(Object.keys(replacements)).toEqual([sourceCacheImagePath]);
        const materializedPath = replacements[sourceCacheImagePath];
        expect(materializedPath).toBe(
            path.join(projectDir, "assets", "capture.png")
        );
        await expect(fs.access(materializedPath)).resolves.toBeUndefined();
        const materializedContent = await fs.readFile(materializedPath);
        expect(materializedContent).toEqual(sourceContent);

        const project: ProjectFile<ImageSet> = {
            version: "1.0.0",
            window: {
                width: 1024,
                height: 768,
                x: 100,
                y: 50,
                color: "#10203040",
            },
            settings: {
                unitFactor: 2,
                unit: "mm",
            },
            canvas: {
                x: 10,
                y: 20,
                scale: 1.5,
            },
            images: [
                {
                    id: "img-1",
                    path: materializedPath,
                    sourceType: "file",
                    transparency: 20,
                    rotation: 5,
                    initAnchorPos: null,
                    currentAnchorPos: null,
                    visible: true,
                    locked: false,
                },
            ],
            dimensionLines: [
                {
                    id: "line-1",
                    start: { x: 0, y: 0 },
                    end: { x: 100, y: 100 },
                    color: "#00ff00",
                    showUnitLabel: true,
                },
            ],
        };

        await repository.saveProject(projectFilePath, project);
        const loaded = (await repository.loadProject(
            projectFilePath
        )) as ProjectFile<ImageSet>;

        expect(loaded).toEqual(project);
    });

    it("loads legacy JSON and applies schema migration defaults", async () => {
        const repository = new ProjectRepository();
        const projectFilePath = path.join(tempRootDir, "legacy.iot");

        const legacyProject = {
            window: {
                width: "invalid",
                height: 640,
                x: 32,
                y: "invalid",
                color: "",
            },
            settings: {
                unitFactor: -5,
                unit: "cm",
            },
            images: [
                {
                    path: "C:/legacy/sample.png",
                    sourceType: "cache",
                    transparency: 120,
                    rotation: "invalid",
                    init_anchor_pos: {
                        lt: { x: 0, y: 0 },
                        lb: { x: 0, y: 50 },
                        rt: { x: 50, y: 0 },
                        rb: { x: 50, y: 50 },
                    },
                    current_anchor_pos: null,
                    filters: {
                        binarization: {
                            enabled: true,
                            threshold: 88,
                        },
                    },
                },
            ],
        };

        await fs.writeFile(
            projectFilePath,
            JSON.stringify(legacyProject, null, 2),
            "utf-8"
        );

        const loaded = (await repository.loadProject(
            projectFilePath
        )) as ProjectFile<ImageSet>;

        expect(loaded.version).toBe("1.0.0");
        expect(loaded.window).toEqual({
            width: 800,
            height: 640,
            x: 32,
            y: 0,
            color: "#00000000",
        });
        expect(loaded.settings).toEqual({
            unitFactor: 0.0001,
            unit: "um",
        });
        expect(loaded.images).toHaveLength(1);
        expect(loaded.images[0].id).toBe("migrated-image-0");
        expect(loaded.images[0].sourceType).toBe("cache");
        expect(loaded.images[0].transparency).toBe(100);
        expect(loaded.images[0].rotation).toBe(0);
        expect(loaded.images[0].initAnchorPos).toEqual({
            lt: { x: 0, y: 0 },
            lb: { x: 0, y: 50 },
            rt: { x: 50, y: 0 },
            rb: { x: 50, y: 50 },
        });
    });
});
