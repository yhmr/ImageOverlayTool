import { describe, it, expect, vi, beforeEach } from "vitest";
import { dialog, BrowserWindow } from "electron";
import { registerProjectHandlers } from "@/main/ipc/project";
import { MockProjectRepository } from "../../support/mocks/repositories/MockProjectRepository";
import { ProjectFile } from "@/shared/types/ProjectFile";
import { invokeIpcHandler } from "../../support/helpers/ipcTestHelper";

const { mockMaterializeCacheImages, mockDeleteManagedClipboardCacheFiles } =
    vi.hoisted(() => ({
    mockMaterializeCacheImages: vi.fn(),
    mockDeleteManagedClipboardCacheFiles: vi.fn(),
}));

// Mock electron
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
        isPackaged: false,
    },
}));

vi.mock("@/main/services/ProjectService", () => ({
    ProjectService: class {
        materializeCacheImages = mockMaterializeCacheImages;
        deleteManagedClipboardCacheFiles =
            mockDeleteManagedClipboardCacheFiles;
    },
}));

// Mock logger
vi.mock("@/main/logger", () => ({
    default: {
        debug: vi.fn(),
        info: vi.fn(),
        error: vi.fn(),
    },
}));

describe("IPC Project Handlers", () => {
    let mockRepo: MockProjectRepository;
    const asBrowserWindow = (value: Partial<BrowserWindow>): BrowserWindow =>
        value as unknown as BrowserWindow;
    const createProject = (): ProjectFile => ({
        version: "1.0.0",
        window: { width: 800, height: 600, x: 0, y: 0, color: "#000" },
        settings: { unitFactor: 1, unit: "um" },
        images: [],
    });

    beforeEach(() => {
        vi.clearAllMocks();
        mockMaterializeCacheImages.mockReset();
        mockDeleteManagedClipboardCacheFiles.mockReset();
        mockRepo = new MockProjectRepository();
        // Register handlers using the mock repository
        registerProjectHandlers(mockRepo);
    });

    describe("project:save", () => {
        it("should save project using repository", async () => {
            const dummyProject = createProject();
            const filePath = "/path/to/project.iot";

            // Execute the handler via helper
            const result = await invokeIpcHandler("project:save", {}, {
                filePath,
                project: dummyProject,
            });

            // Verify result
            expect(result).toBe(true);

            // Verify data was saved in mock repo
            const saved = await mockRepo.loadProject(filePath);
            expect(saved).toEqual(dummyProject);
            expect(mockDeleteManagedClipboardCacheFiles).not.toHaveBeenCalled();
        });

        it("should delete cache images after successful save when paths are provided", async () => {
            const dummyProject: ProjectFile = {
                version: "1.0.0",
                window: { width: 800, height: 600, x: 0, y: 0, color: "#000" },
                settings: { unitFactor: 1, unit: "um" },
                images: [],
            };
            const filePath = "/path/to/project.iot";
            const cacheImagePathsToDelete = ["/cache/a.png", "/cache/b.png"];

            const result = await invokeIpcHandler("project:save", {}, {
                filePath,
                project: dummyProject,
                cacheImagePathsToDelete,
            });

            expect(result).toBe(true);
            expect(mockDeleteManagedClipboardCacheFiles).toHaveBeenCalledWith(
                cacheImagePathsToDelete
            );
        });

        it("should throw error if repository fails", async () => {
            const error = new Error("Save failed");
            vi.spyOn(mockRepo, "saveProject").mockRejectedValue(error);

            await expect(
                invokeIpcHandler("project:save", {}, {
                    filePath: "test.iot",
                    project: {},
                })
            ).rejects.toThrow("Save failed");
            expect(mockDeleteManagedClipboardCacheFiles).not.toHaveBeenCalled();
        });

        it("should reject invalid payload for cache delete paths", async () => {
            await expect(
                invokeIpcHandler("project:save", {}, {
                    filePath: "test.iot",
                    project: {},
                    cacheImagePathsToDelete: "not-an-array",
                })
            ).rejects.toThrow("Invalid payload for project:save");
        });
    });

    describe("project:saveAs", () => {
        it("should open save dialog and save project", async () => {
            // Mock dialog result
            const savePath = "/path/to/new_project.iot";
            vi.mocked(dialog.showSaveDialog).mockResolvedValue({
                canceled: false,
                filePath: savePath,
            });

            const dummyProject = createProject();

            // Execute handler (mock event with sender needed for BrowserWindow.fromWebContents)
            const mockEvent = { sender: {} };
            const result = await invokeIpcHandler(
                "project:saveAs",
                mockEvent,
                dummyProject
            );

            expect(result).toBe(savePath);

            // Verify repo saved
            const saved = await mockRepo.loadProject(savePath);
            expect(saved).toEqual(dummyProject);
        });

        it("should do nothing if dialog canceled", async () => {
            vi.mocked(dialog.showSaveDialog).mockResolvedValue({
                canceled: true,
                filePath: "",
            });

            const result = await invokeIpcHandler(
                "project:saveAs",
                { sender: {} },
                {}
            );
            expect(result).toBeNull();
        });

        it("should throw error if repository fails", async () => {
            vi.mocked(dialog.showSaveDialog).mockResolvedValue({
                canceled: false,
                filePath: "/path/to/save.iot",
            });

            const error = new Error("SaveAs failed");
            vi.spyOn(mockRepo, "saveProject").mockRejectedValue(error);

            await expect(
                invokeIpcHandler("project:saveAs", { sender: {} }, {})
            ).rejects.toThrow("SaveAs failed");
        });

        it("should use parent window when available for save dialog", async () => {
            vi.mocked(BrowserWindow.fromWebContents).mockReturnValueOnce(
                asBrowserWindow({})
            );
            vi.mocked(dialog.showSaveDialog).mockResolvedValueOnce({
                canceled: true,
                filePath: "",
            });

            await invokeIpcHandler("project:saveAs", { sender: {} }, {});

            expect(dialog.showSaveDialog).toHaveBeenCalledWith(
                expect.any(Object),
                expect.objectContaining({
                    title: "Save Project",
                    defaultPath: "project.iot",
                })
            );
        });
    });

    describe("project:pickSavePath", () => {
        it("should return selected save path", async () => {
            vi.mocked(dialog.showSaveDialog).mockResolvedValueOnce({
                canceled: false,
                filePath: "/path/to/picked.iot",
            });

            const result = await invokeIpcHandler("project:pickSavePath", {
                sender: {},
            });

            expect(result).toBe("/path/to/picked.iot");
        });

        it("should return null when save path dialog is canceled", async () => {
            vi.mocked(dialog.showSaveDialog).mockResolvedValueOnce({
                canceled: true,
                filePath: "",
            });

            const result = await invokeIpcHandler("project:pickSavePath", {
                sender: {},
            });

            expect(result).toBeNull();
        });

        it("should throw when save path dialog fails", async () => {
            vi.mocked(dialog.showSaveDialog).mockRejectedValueOnce(
                new Error("pick failed")
            );

            await expect(
                invokeIpcHandler("project:pickSavePath", { sender: {} })
            ).rejects.toThrow("pick failed");
        });
    });

    describe("project:load", () => {
        it("should open open dialog and load project", async () => {
            const loadPath = "/path/to/load.iot";
            vi.mocked(dialog.showOpenDialog).mockResolvedValue({
                canceled: false,
                filePaths: [loadPath],
            });

            // Prepare data
            const existingProject: ProjectFile = {
                version: "1.0.0",
                window: { width: 100, height: 100, x: 0, y: 0, color: "#FFF" },
                settings: { unitFactor: 1, unit: "mm" },
                images: [],
            };
            await mockRepo.saveProject(loadPath, existingProject);

            const result = await invokeIpcHandler("project:load", { sender: {} });
            expect(result).toEqual({ project: existingProject, filePath: loadPath });
        });

        it("should return null if dialog canceled", async () => {
            vi.mocked(dialog.showOpenDialog).mockResolvedValue({
                canceled: true,
                filePaths: [],
            });

            const result = await invokeIpcHandler("project:load", { sender: {} });
            expect(result).toBeNull();
        });

        it("should throw error if repository fails", async () => {
            vi.mocked(dialog.showOpenDialog).mockResolvedValue({
                canceled: false,
                filePaths: ["/path/to/load.iot"],
            });

            const error = new Error("Load failed");
            vi.spyOn(mockRepo, "loadProject").mockRejectedValue(error);

            await expect(invokeIpcHandler("project:load", { sender: {} })).rejects.toThrow(
                "Load failed"
            );
        });
    });

    describe("project:loadFromPath", () => {
        it("should load project from repository", async () => {
            // Setup data in mock repo
            const filePath = "/app/existing.iot";
            const existingProject: ProjectFile = {
                version: "1.0.0",
                window: { width: 100, height: 100, x: 10, y: 10, color: "#FFF" },
                settings: { unitFactor: 2, unit: "mm" },
                images: [],
            };
            await mockRepo.saveProject(filePath, existingProject);

            // Execute handler
            const result = await invokeIpcHandler(
                "project:loadFromPath",
                {},
                filePath
            );

            // Verify result
            expect(result).toEqual({ project: existingProject, filePath });
        });

        it("should return null if repository fails", async () => {
            const error = new Error("LoadFromPath failed");
            vi.spyOn(mockRepo, "loadProject").mockRejectedValue(error);

            const result = await invokeIpcHandler(
                "project:loadFromPath",
                {},
                "/failed/path.iot"
            );
            expect(result).toBeNull();
        });
    });

    describe("project:materializeCacheImages", () => {
        it("should materialize cache images and return replacements", async () => {
            const payload = {
                projectFilePath: "/project/test.iot",
                cacheImagePaths: ["/cache/a.png", "/cache/b.png"],
            };
            const replacements = {
                "/cache/a.png": "/project/assets/a.png",
                "/cache/b.png": "/project/assets/b.png",
            };
            mockMaterializeCacheImages.mockResolvedValue(replacements);

            const result = await invokeIpcHandler(
                "project:materializeCacheImages",
                {},
                payload
            );

            expect(mockMaterializeCacheImages).toHaveBeenCalledWith(
                payload.projectFilePath,
                payload.cacheImagePaths
            );
            expect(result).toEqual(replacements);
        });

        it("should reject invalid payload", async () => {
            await expect(
                invokeIpcHandler("project:materializeCacheImages", {}, {})
            ).rejects.toThrow("Invalid payload for project:materializeCacheImages");
        });

        it("should propagate errors from ProjectService", async () => {
            mockMaterializeCacheImages.mockRejectedValue(
                new Error("materialize failed")
            );

            await expect(
                invokeIpcHandler("project:materializeCacheImages", {}, {
                    projectFilePath: "/project/test.iot",
                    cacheImagePaths: ["/cache/a.png"],
                })
            ).rejects.toThrow("materialize failed");
        });
    });

    describe("e2e test mode", () => {
        const e2eProjectPath = "/tmp/e2e/project.iot";

        beforeEach(() => {
            vi.clearAllMocks();
            mockRepo = new MockProjectRepository();
            registerProjectHandlers(mockRepo, {
                testMode: {
                    enabled: true,
                    projectFilePath: e2eProjectPath,
                },
            });
        });

        it("saveAs should bypass native save dialog and use fixed file path", async () => {
            const dummyProject = createProject();

            const result = await invokeIpcHandler(
                "project:saveAs",
                { sender: {} },
                dummyProject
            );

            expect(result).toBe(e2eProjectPath);
            expect(dialog.showSaveDialog).not.toHaveBeenCalled();
            await expect(mockRepo.loadProject(e2eProjectPath)).resolves.toEqual(
                dummyProject
            );
        });

        it("load should bypass native open dialog and use fixed file path", async () => {
            const existingProject: ProjectFile = {
                version: "1.0.0",
                window: { width: 100, height: 100, x: 10, y: 10, color: "#FFF" },
                settings: { unitFactor: 2, unit: "mm" },
                images: [],
            };
            await mockRepo.saveProject(e2eProjectPath, existingProject);

            const result = await invokeIpcHandler("project:load", { sender: {} });

            expect(dialog.showOpenDialog).not.toHaveBeenCalled();
            expect(result).toEqual({
                project: existingProject,
                filePath: e2eProjectPath,
            });
        });

        it("load should return null in e2e mode when source file is missing", async () => {
            vi.spyOn(mockRepo, "loadProject").mockRejectedValueOnce(
                new Error("missing")
            );
            const result = await invokeIpcHandler("project:load", { sender: {} });

            expect(dialog.showOpenDialog).not.toHaveBeenCalled();
            expect(result).toBeNull();
        });
    });
});

