import { describe, it, expect, vi, beforeEach } from "vitest";
import { ipcMain, dialog } from "electron";
import { registerProjectHandlers } from "@/main/ipc/project";
import { MockProjectRepository } from "../repositories/mocks/MockProjectRepository";
import { ProjectFile } from "@/shared/types/ProjectFile";

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

    beforeEach(() => {
        vi.clearAllMocks();
        mockRepo = new MockProjectRepository();
        // Register handlers using the mock repository
        registerProjectHandlers(mockRepo);
    });

    it("should register handlers for project IPC events", () => {
        expect(ipcMain.handle).toHaveBeenCalledWith("project:saveAs", expect.any(Function));
        expect(ipcMain.handle).toHaveBeenCalledWith("project:save", expect.any(Function));
        expect(ipcMain.handle).toHaveBeenCalledWith("project:load", expect.any(Function));
        expect(ipcMain.handle).toHaveBeenCalledWith("project:loadFromPath", expect.any(Function));
    });

    describe("project:save", () => {
        it("should save project using repository", async () => {
            // Get the registered handler function
            const calls = vi.mocked(ipcMain.handle).mock.calls;
            const saveHandler = calls.find((call) => call[0] === "project:save")?.[1];
            expect(saveHandler).toBeDefined();

            if (saveHandler) {
                const dummyProject: ProjectFile = {
                    version: "1.0.0",
                    window: { width: 800, height: 600, x: 0, y: 0, color: "#000" },
                    settings: { unitFactor: 1, unit: "um" },
                    images: [],
                };
                const filePath = "/path/to/project.iot";

                // Execute the handler
                const result = await saveHandler({} as any, { filePath, project: dummyProject });

                // Verify result
                expect(result).toBe(true);

                // Verify data was saved in mock repo
                const saved = await mockRepo.loadProject(filePath);
                expect(saved).toEqual(dummyProject);
            }
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

            const calls = vi.mocked(ipcMain.handle).mock.calls;
            const handler = calls.find((call) => call[0] === "project:saveAs")?.[1];

            if (handler) {
                const dummyProject: ProjectFile = {
                    version: "1.0.0",
                    window: { width: 800, height: 600, x: 0, y: 0, color: "#000" },
                    settings: { unitFactor: 1, unit: "um" },
                    images: [],
                };

                // Execute handler (event.sender is mocked implicitly by checking window logic inside handler, or we assume no window for simplecity if safe)
                // The implementation uses BrowserWindow.fromWebContents(event.sender). 
                // We need to mock event.sender.
                const mockEvent = { sender: {} } as any;

                const result = await handler(mockEvent, dummyProject);

                expect(result).toBe(savePath);

                // Verify repo saved
                const saved = await mockRepo.loadProject(savePath);
                expect(saved).toEqual(dummyProject);
            }
        });

        it("should do nothing if dialog canceled", async () => {
            vi.mocked(dialog.showSaveDialog).mockResolvedValue({
                canceled: true,
                filePath: undefined as any,
            });

            const calls = vi.mocked(ipcMain.handle).mock.calls;
            const handler = calls.find((call) => call[0] === "project:saveAs")?.[1];

            if (handler) {
                const result = await handler({ sender: {} } as any, {} as any);
                expect(result).toBeNull();
            }
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

            const calls = vi.mocked(ipcMain.handle).mock.calls;
            const handler = calls.find((call) => call[0] === "project:load")?.[1];

            if (handler) {
                const result = await handler({ sender: {} } as any);
                expect(result).toEqual({ project: existingProject, filePath: loadPath });
            }
        });

        it("should return null if dialog canceled", async () => {
            vi.mocked(dialog.showOpenDialog).mockResolvedValue({
                canceled: true,
                filePaths: [],
            });

            const calls = vi.mocked(ipcMain.handle).mock.calls;
            const handler = calls.find((call) => call[0] === "project:load")?.[1];

            if (handler) {
                const result = await handler({ sender: {} } as any);
                expect(result).toBeNull();
            }
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

            // Get handler
            const calls = vi.mocked(ipcMain.handle).mock.calls;
            const loadHandler = calls.find((call) => call[0] === "project:loadFromPath")?.[1];
            expect(loadHandler).toBeDefined();

            if (loadHandler) {
                // Execute handler
                const result = await loadHandler({} as any, filePath);

                // Verify result
                expect(result).toEqual({ project: existingProject, filePath });
            }
        });
        describe("project:save error handling", () => {
            it("should throw error if repository fails", async () => {
                const error = new Error("Save failed");
                vi.spyOn(mockRepo, "saveProject").mockRejectedValue(error);

                const calls = vi.mocked(ipcMain.handle).mock.calls;
                const saveHandler = calls.find((call) => call[0] === "project:save")?.[1];

                if (saveHandler) {
                    await expect(saveHandler({} as any, { filePath: "test.iot", project: {} as any }))
                        .rejects.toThrow("Save failed");
                }
            });
        });

        describe("project:saveAs error handling", () => {
            it("should throw error if repository fails", async () => {
                vi.mocked(dialog.showSaveDialog).mockResolvedValue({
                    canceled: false,
                    filePath: "/path/to/save.iot",
                });

                const error = new Error("SaveAs failed");
                vi.spyOn(mockRepo, "saveProject").mockRejectedValue(error);

                const calls = vi.mocked(ipcMain.handle).mock.calls;
                const handler = calls.find((call) => call[0] === "project:saveAs")?.[1];

                if (handler) {
                    await expect(handler({ sender: {} } as any, {} as any))
                        .rejects.toThrow("SaveAs failed");
                }
            });
        });

        describe("project:load error handling", () => {
            it("should throw error if repository fails", async () => {
                vi.mocked(dialog.showOpenDialog).mockResolvedValue({
                    canceled: false,
                    filePaths: ["/path/to/load.iot"],
                });

                const error = new Error("Load failed");
                vi.spyOn(mockRepo, "loadProject").mockRejectedValue(error);

                const calls = vi.mocked(ipcMain.handle).mock.calls;
                const handler = calls.find((call) => call[0] === "project:load")?.[1];

                if (handler) {
                    await expect(handler({ sender: {} } as any))
                        .rejects.toThrow("Load failed");
                }
            });
        });

        describe("project:loadFromPath error handling", () => {
            it("should return null if repository fails", async () => {
                const error = new Error("LoadFromPath failed");
                vi.spyOn(mockRepo, "loadProject").mockRejectedValue(error);

                const calls = vi.mocked(ipcMain.handle).mock.calls;
                const handler = calls.find((call) => call[0] === "project:loadFromPath")?.[1];

                if (handler) {
                    const result = await handler({} as any, "/failed/path.iot");
                    expect(result).toBeNull();
                }
            });
        });
    });
});
