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

import { dialog } from "electron";
import { registerProjectHandlers } from "@/main/ipc/project";
import { ProjectRepository } from "@/main/repositories/ProjectRepository";
import type { ImageSet } from "@/shared/types/ImageSet";
import type { ProjectFile } from "@/shared/types/ProjectFile";
import { invokeIpcHandler } from "../../unit/main/utils/ipcTestHelper";

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

    it("round-trips saveAs/load via test mode without native dialogs", async () => {
        const project = createProject("C:/images/sample.png");

        const savedPath = await invokeIpcHandler(
            "project:saveAs",
            { sender: {} },
            project
        );
        expect(savedPath).toBe(testModeProjectPath);
        expect(dialog.showSaveDialog).not.toHaveBeenCalled();

        const loaded = await invokeIpcHandler("project:load", { sender: {} });
        expect(loaded).toEqual({
            project,
            filePath: testModeProjectPath,
        });
        expect(dialog.showOpenDialog).not.toHaveBeenCalled();
    });

    it("materializes cache image then project:save deletes managed cache files only", async () => {
        const managedCacheDir = path.join(userDataDir, "clipboard-cache");
        const unmanagedDir = path.join(tempRootDir, "external-cache");
        await fs.mkdir(managedCacheDir, { recursive: true });
        await fs.mkdir(unmanagedDir, { recursive: true });

        const managedCachePath = path.join(managedCacheDir, "clipboard.png");
        const unmanagedCachePath = path.join(unmanagedDir, "clipboard.png");
        await fs.writeFile(managedCachePath, Buffer.from("managed"));
        await fs.writeFile(unmanagedCachePath, Buffer.from("unmanaged"));

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
});
