import { BrowserWindow, dialog, ipcMain } from "electron";
import type { IpcMainInvokeEvent } from "electron";
import { ProjectFile } from "../../../shared/types/ProjectFile";
import {
    projectIpcContracts,
    type SaveProjectPayload,
} from "../../../shared/ipc/contracts/project";
import log from "../../logger";
import type { ProjectHandlerContext } from "./types";

const saveDialogOptions = {
    title: "Save Project",
    defaultPath: "project.iot",
    filters: [{ name: "Overlay Project", extensions: ["iot"] }],
};

const selectProjectSavePath = async (
    event: IpcMainInvokeEvent,
    testMode: ProjectHandlerContext["testMode"]
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

export const registerProjectSaveHandlers = (
    context: ProjectHandlerContext
): void => {
    ipcMain.handle(
        projectIpcContracts.saveAs.channel,
        async (event, project: ProjectFile) => {
            log.debug("[IPC] project:saveAs called");

            try {
                const filePath = await selectProjectSavePath(
                    event,
                    context.testMode
                );
                if (!filePath) {
                    log.debug("[IPC] project:saveAs canceled by user");
                    return null;
                }

                await context.repository.saveProject(filePath, project);
                log.info(`[IPC] project:saveAs saved to: ${filePath}`);
                return filePath;
            } catch (error) {
                log.error("[IPC] project:saveAs failed:", error);
                throw error;
            }
        }
    );

    ipcMain.handle(projectIpcContracts.pickSavePath.channel, async (event) => {
        log.debug("[IPC] project:pickSavePath called");
        try {
            const filePath = await selectProjectSavePath(
                event,
                context.testMode
            );
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
        projectIpcContracts.save.channel,
        async (
            _event,
            { filePath, project, cacheImagePathsToDelete }: SaveProjectPayload
        ) => {
            log.debug(`[IPC] project:save called for: ${filePath}`);
            try {
                if (
                    !filePath ||
                    typeof filePath !== "string" ||
                    !project ||
                    (cacheImagePathsToDelete !== undefined &&
                        !Array.isArray(cacheImagePathsToDelete))
                ) {
                    throw new Error("Invalid payload for project:save");
                }

                await context.repository.saveProject(filePath, project);
                if (cacheImagePathsToDelete && cacheImagePathsToDelete.length) {
                    await context.projectService.deleteManagedClipboardCacheFiles(
                        cacheImagePathsToDelete
                    );
                }
                log.info(`[IPC] project:save completed: ${filePath}`);
                return true;
            } catch (error) {
                log.error(`[IPC] project:save failed for ${filePath}:`, error);
                throw error;
            }
        }
    );
};
