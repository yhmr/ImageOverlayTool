import fs from "fs/promises";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetPath } = vi.hoisted(() => ({
    mockGetPath: vi.fn(),
}));

vi.mock("electron", () => ({
    ipcMain: {
        handle: vi.fn(),
    },
    dialog: {
        showSaveDialog: vi.fn(),
        showOpenDialog: vi.fn(),
    },
    BrowserWindow: {
        fromWebContents: vi.fn(),
    },
    app: {
        isPackaged: true,
        getPath: mockGetPath,
    },
}));

vi.mock("@/main/logger", () => ({
    default: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}));

import { registerProjectHandlers } from "@/main/ipc/project";
import { ProjectRepository } from "@/main/repositories/ProjectRepository";
import type { ImageSet } from "@/shared/types/ImageSet";
import type { ProjectFile } from "@/shared/types/ProjectFile";
import { invokeIpcHandler } from "../../support/helpers/ipcTestHelper";

const createProject = (imagePath: string): ProjectFile<ImageSet> => ({
    version: "1.0.0",
    window: {
        width: 1280,
        height: 720,
        x: 10,
        y: 20,
        color: "#01020304",
    },
    settings: {
        unitFactor: 2,
        unit: "mm",
    },
    images: [
        {
            id: "img-1",
            path: imagePath,
            sourceType: "file",
            transparency: 0,
            rotation: 0,
            initAnchorPos: null,
            currentAnchorPos: null,
            visible: true,
        },
    ],
});

describe("Main integration: project IPC round-trip", () => {
    let tempRootDir: string;
    let userDataDir: string;
    let testModeProjectPath: string;

    beforeEach(async () => {
        vi.clearAllMocks();

        tempRootDir = await fs.mkdtemp(path.join(os.tmpdir(), "iot-int-"));
        userDataDir = path.join(tempRootDir, "user-data");
        testModeProjectPath = path.join(tempRootDir, "test-mode-project.iot");
        mockGetPath.mockReturnValue(userDataDir);

        registerProjectHandlers(new ProjectRepository(), {
            testMode: {
                enabled: true,
                projectFilePath: testModeProjectPath,
            },
        });
    });

    afterEach(async () => {
        await fs.rm(tempRootDir, { recursive: true, force: true });
    });

    it("persists project file via project:saveAs in test mode", async () => {
        const project = createProject("C:/images/sample.png");

        const savedPath = await invokeIpcHandler(
            "project:saveAs",
            { sender: {} },
            project
        );

        expect(savedPath).toBe(testModeProjectPath);
        const savedRaw = await fs.readFile(testModeProjectPath, "utf8");
        const saved = JSON.parse(savedRaw) as ProjectFile<ImageSet>;
        expect(saved).toEqual(project);
    });

    it("loads project file via project:load in test mode", async () => {
        const project = createProject("C:/images/sample.png");
        await fs.writeFile(
            testModeProjectPath,
            JSON.stringify(project, null, 2),
            "utf8"
        );
        const loaded = await invokeIpcHandler("project:load", { sender: {} });

        expect(loaded).toEqual({
            project,
            filePath: testModeProjectPath,
        });
    });

    it("materializes cache image path via project:materializeCacheImages", async () => {
        const managedCacheDir = path.join(userDataDir, "clipboard-cache");
        await fs.mkdir(managedCacheDir, { recursive: true });
        const managedCachePath = path.join(managedCacheDir, "clipboard.png");
        await fs.writeFile(managedCachePath, Buffer.from("managed"));

        const projectFilePath = path.join(tempRootDir, "project", "saved.iot");
        const replacements = await invokeIpcHandler(
            "project:materializeCacheImages",
            {},
            {
                projectFilePath,
                cacheImagePaths: [managedCachePath],
            }
        );

        const materializedPath = path.join(
            tempRootDir,
            "project",
            "assets",
            "clipboard.png"
        );
        expect(replacements).toEqual({
            [managedCachePath]: materializedPath,
        });
        await expect(fs.readFile(materializedPath, "utf8")).resolves.toBe(
            "managed"
        );
    });

    it("deletes only managed cache files via project:save payload", async () => {
        const managedCacheDir = path.join(userDataDir, "clipboard-cache");
        const unmanagedDir = path.join(tempRootDir, "external-cache");
        await fs.mkdir(managedCacheDir, { recursive: true });
        await fs.mkdir(unmanagedDir, { recursive: true });

        const managedCachePath = path.join(managedCacheDir, "clipboard.png");
        const unmanagedCachePath = path.join(unmanagedDir, "clipboard.png");
        await fs.writeFile(managedCachePath, Buffer.from("managed"));
        await fs.writeFile(unmanagedCachePath, Buffer.from("unmanaged"));

        const projectFilePath = path.join(tempRootDir, "project", "saved.iot");
        const materializedPath = path.join(
            tempRootDir,
            "project",
            "assets",
            "clipboard.png"
        );
        await fs.mkdir(path.dirname(materializedPath), { recursive: true });
        await fs.writeFile(materializedPath, Buffer.from("materialized"));

        const saveResult = await invokeIpcHandler("project:save", {}, {
            filePath: projectFilePath,
            project: createProject(materializedPath),
            cacheImagePathsToDelete: [managedCachePath, unmanagedCachePath],
        });

        expect(saveResult).toBe(true);
        await expect(fs.access(managedCachePath)).rejects.toThrow();
        await expect(fs.readFile(unmanagedCachePath, "utf8")).resolves.toBe(
            "unmanaged"
        );
    });

    it("loads saved project via project:loadFromPath", async () => {
        const projectFilePath = path.join(tempRootDir, "project", "saved.iot");
        const materializedPath = path.join(
            tempRootDir,
            "project",
            "assets",
            "clipboard.png"
        );
        await fs.mkdir(path.dirname(materializedPath), { recursive: true });
        await fs.writeFile(materializedPath, Buffer.from("materialized"));
        await invokeIpcHandler("project:save", {}, {
            filePath: projectFilePath,
            project: createProject(materializedPath),
        });

        const loadedFromPath = await invokeIpcHandler(
            "project:loadFromPath",
            {},
            projectFilePath
        );

        expect(loadedFromPath).toEqual({
            project: createProject(materializedPath),
            filePath: projectFilePath,
        });
    });

    it("loads legacy project via project:loadFromPath and applies migration defaults", async () => {
        const legacyProjectPath = path.join(tempRootDir, "project", "legacy.iot");
        await fs.mkdir(path.dirname(legacyProjectPath), { recursive: true });

        const legacyProject = {
            window: {
                width: "invalid",
                height: 640,
                x: 32,
                y: "invalid",
                color: "",
            },
            settings: {
                unitFactor: -1,
                unit: "cm",
            },
            images: [
                {
                    path: "C:/legacy/sample.png",
                    sourceType: "cache",
                    transparency: 120,
                    rotation: "invalid",
                },
            ],
        };

        await fs.writeFile(
            legacyProjectPath,
            JSON.stringify(legacyProject, null, 2),
            "utf8"
        );

        const loadedFromPath = await invokeIpcHandler(
            "project:loadFromPath",
            {},
            legacyProjectPath
        );

        expect(loadedFromPath).not.toBeNull();
        expect(loadedFromPath).toMatchObject({
            filePath: legacyProjectPath,
            project: {
                version: "1.0.0",
                window: {
                    width: 800,
                    height: 640,
                    x: 32,
                    y: 0,
                    color: "#00000000",
                },
                settings: {
                    unitFactor: 0.0001,
                    unit: "um",
                },
                images: [
                    expect.objectContaining({
                        path: "C:/legacy/sample.png",
                        sourceType: "cache",
                        transparency: 100,
                        rotation: 0,
                    }),
                ],
            },
        });
    });
});


