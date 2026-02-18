import { ipcMain, dialog, BrowserWindow } from "electron";
import type { IpcMainInvokeEvent } from "electron";
import { IProjectRepository } from "../repositories/ProjectRepository";
import { ProjectFile } from "../../shared/types/ProjectFile";
import log from "../logger";
import { IPC_CHANNELS } from "../../shared/ipc/channels";
import { ProjectService } from "../services/ProjectService";

export interface ProjectHandlerOptions {
    testMode?: {
        enabled: boolean;
        projectFilePath: string;
    };
}

export const registerProjectHandlers = (
    repository: IProjectRepository,
    options?: ProjectHandlerOptions
) => {
    const testMode = options?.testMode;
    const projectService = new ProjectService();

    const saveDialogOptions = {
        title: "Save Project",
        defaultPath: "project.iot",
        filters: [{ name: "Overlay Project", extensions: ["iot"] }],
    };

    const selectProjectSavePath = async (
        event: IpcMainInvokeEvent
    ): Promise<string | null> => {
        if (testMode?.enabled) {
            return testMode.projectFilePath;
        }

        const window = BrowserWindow.fromWebContents(event.sender);
        const result = window
            ? await dialog.showSaveDialog(window, saveDialogOptions)
            : await dialog.showSaveDialog(saveDialogOptions);

        if (result.canceled || !result.filePath) {
            return null;
        }

        return result.filePath;
    };

    ipcMain.handle(
        IPC_CHANNELS.project.saveAs,
        async (event, project: ProjectFile) => {
            log.debug("[IPC] project:saveAs called");

            try {
                const filePath = await selectProjectSavePath(event);
                if (!filePath) {
                    log.debug("[IPC] project:saveAs canceled by user");
                    return null;
                }

                await repository.saveProject(filePath, project);
                log.info(`[IPC] project:saveAs saved to: ${filePath}`);
                return filePath;
            } catch (error) {
                log.error("[IPC] project:saveAs failed:", error);
                throw error;
            }
        }
    );

    ipcMain.handle(IPC_CHANNELS.project.pickSavePath, async (event) => {
        log.debug("[IPC] project:pickSavePath called");
        try {
            const filePath = await selectProjectSavePath(event);
            if (!filePath) {
                log.debug("[IPC] project:pickSavePath canceled by user");
                return null;
            }
            log.info(`[IPC] project:pickSavePath selected: ${filePath}`);
            return filePath;
        } catch (error) {
            log.error("[IPC] project:pickSavePath failed:", error);
            throw error;
        }
    });

    ipcMain.handle(
        IPC_CHANNELS.project.save,
        async (
            event,
            { filePath, project }: { filePath: string; project: ProjectFile }
        ) => {
            log.debug(`[IPC] project:save called for: ${filePath}`);
            try {
                await repository.saveProject(filePath, project);
                log.info(`[IPC] project:save completed: ${filePath}`);
                return true;
            } catch (error) {
                log.error(`[IPC] project:save failed for ${filePath}:`, error);
                throw error;
            }
        }
    );

    ipcMain.handle(IPC_CHANNELS.project.load, async (event) => {
        log.debug("[IPC] project:load called");

        if (testMode?.enabled) {
            try {
                const project = await repository.loadProject(
                    testMode.projectFilePath
                );
                log.info(
                    `[IPC] project:load completed in e2e mode: ${testMode.projectFilePath}`
                );
                return { project, filePath: testMode.projectFilePath };
            } catch {
                log.debug(
                    `[IPC] project:load e2e source unavailable: ${testMode.projectFilePath}`
                );
                return null;
            }
        }

        const window = BrowserWindow.fromWebContents(event.sender);
        const options: Electron.OpenDialogOptions = {
            title: "Open Project",
            filters: [{ name: "Overlay Project", extensions: ["iot"] }],
            properties: ["openFile"],
        };
        try {
            const { canceled, filePaths } = window
                ? await dialog.showOpenDialog(window, options)
                : await dialog.showOpenDialog(options);

            if (canceled || filePaths.length === 0) {
                log.debug("[IPC] project:load canceled by user");
                return null;
            }

            const filePath = filePaths[0];
            const project = await repository.loadProject(filePath);
            log.info(`[IPC] project:load completed: ${filePath}`);
            return { project, filePath };
        } catch (error) {
            log.error("[IPC] project:load failed:", error);
            throw error;
        }
    });

    ipcMain.handle(
        IPC_CHANNELS.project.loadFromPath,
        async (event, filePath: string) => {
            log.debug(`[IPC] project:loadFromPath called for: ${filePath}`);
            try {
                const project = await repository.loadProject(filePath);
                log.info(`[IPC] project:loadFromPath completed: ${filePath}`);
                return { project, filePath };
            } catch (error) {
                log.error(
                    `[IPC] project:loadFromPath failed for ${filePath}:`,
                    error
                );
                return null;
            }
        }
    );

    ipcMain.handle(
        IPC_CHANNELS.project.materializeCacheImages,
        async (
            _event,
            payload: { projectFilePath: string; cacheImagePaths: string[] }
        ) => {
            log.debug("[IPC] project:materializeCacheImages called");

            const projectFilePath = payload?.projectFilePath;
            const cacheImagePaths = payload?.cacheImagePaths;

            if (
                !projectFilePath ||
                typeof projectFilePath !== "string" ||
                !Array.isArray(cacheImagePaths)
            ) {
                throw new Error(
                    "Invalid payload for project:materializeCacheImages"
                );
            }

            try {
                const replacements =
                    await projectService.materializeCacheImages(
                        projectFilePath,
                        cacheImagePaths
                    );
                log.info("[IPC] project:materializeCacheImages completed", {
                    count: Object.keys(replacements).length,
                });
                return replacements;
            } catch (error) {
                log.error(
                    "[IPC] project:materializeCacheImages failed:",
                    error
                );
                throw error;
            }
        }
    );
};
