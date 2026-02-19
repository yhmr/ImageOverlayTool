import fs from "fs/promises";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetPath } = vi.hoisted(() => ({
    mockGetPath: vi.fn(),
}));

vi.mock("electron", () => ({
    app: {
        isPackaged: true,
        getPath: mockGetPath,
    },
}));

import { ProjectRepository } from "@/main/repositories/ProjectRepository";
import { ProjectService } from "@/main/services/ProjectService";
import type { ImageSet } from "@/shared/types/ImageSet";
import type { ProjectFile } from "@/shared/types/ProjectFile";

const createProjectFile = (imagePaths: string[]): ProjectFile<ImageSet> => ({
    version: "1.0.0",
    window: {
        width: 800,
        height: 600,
        x: 0,
        y: 0,
        color: "#00000000",
    },
    settings: {
        unitFactor: 1,
        unit: "um",
    },
    images: imagePaths.map((imagePath, index) => ({
        id: `img-${index}`,
        path: imagePath,
        sourceType: "file",
        transparency: 0,
        rotation: 0,
        initAnchorPos: null,
        currentAnchorPos: null,
    })),
});

describe("Main integration: project cache lifecycle", () => {
    let tempRootDir: string;
    let userDataDir: string;

    beforeEach(async () => {
        tempRootDir = await fs.mkdtemp(path.join(os.tmpdir(), "iot-int-"));
        userDataDir = path.join(tempRootDir, "user-data");
        mockGetPath.mockReturnValue(userDataDir);
    });

    afterEach(async () => {
        await fs.rm(tempRootDir, { recursive: true, force: true });
    });

    it("materializes cache images with filename collisions and persists project", async () => {
        const repository = new ProjectRepository();
        const service = new ProjectService();

        const sourceDirA = path.join(tempRootDir, "cache-a");
        const sourceDirB = path.join(tempRootDir, "cache-b");
        await fs.mkdir(sourceDirA, { recursive: true });
        await fs.mkdir(sourceDirB, { recursive: true });

        const sourcePathA = path.join(sourceDirA, "capture.png");
        const sourcePathB = path.join(sourceDirB, "capture.png");
        await fs.writeFile(sourcePathA, Buffer.from("cache-a"));
        await fs.writeFile(sourcePathB, Buffer.from("cache-b"));

        const projectFilePath = path.join(tempRootDir, "project", "sample.iot");
        await fs.mkdir(path.dirname(projectFilePath), { recursive: true });

        const replacements = await service.materializeCacheImages(
            projectFilePath,
            [sourcePathA, sourcePathB]
        );

        const expectedPathA = path.join(
            tempRootDir,
            "project",
            "assets",
            "capture.png"
        );
        const expectedPathB = path.join(
            tempRootDir,
            "project",
            "assets",
            "capture-1.png"
        );

        expect(replacements).toEqual({
            [sourcePathA]: expectedPathA,
            [sourcePathB]: expectedPathB,
        });
        await expect(fs.readFile(expectedPathA, "utf8")).resolves.toBe(
            "cache-a"
        );
        await expect(fs.readFile(expectedPathB, "utf8")).resolves.toBe(
            "cache-b"
        );

        const project = createProjectFile([expectedPathA, expectedPathB]);
        await repository.saveProject(projectFilePath, project);
        await expect(repository.loadProject(projectFilePath)).resolves.toEqual(
            project
        );
    });

    it("deletes only managed clipboard cache files", async () => {
        const service = new ProjectService();

        const managedDir = path.join(userDataDir, "clipboard-cache");
        const unmanagedDir = path.join(tempRootDir, "external-cache");
        await fs.mkdir(managedDir, { recursive: true });
        await fs.mkdir(unmanagedDir, { recursive: true });

        const managedPath = path.join(managedDir, "managed.png");
        const untouchedManagedPath = path.join(managedDir, "untouched.png");
        const unmanagedPath = path.join(unmanagedDir, "unmanaged.png");
        await fs.writeFile(managedPath, "managed");
        await fs.writeFile(untouchedManagedPath, "untouched");
        await fs.writeFile(unmanagedPath, "unmanaged");

        await service.deleteManagedClipboardCacheFiles([
            managedPath,
            managedPath,
            unmanagedPath,
            "",
        ]);

        await expect(fs.access(managedPath)).rejects.toThrow();
        await expect(fs.readFile(untouchedManagedPath, "utf8")).resolves.toBe(
            "untouched"
        );
        await expect(fs.readFile(unmanagedPath, "utf8")).resolves.toBe(
            "unmanaged"
        );
    });
});
