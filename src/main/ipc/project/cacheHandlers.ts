import { ipcMain } from "electron";
import { projectIpcContracts } from "../../../shared/ipc/contracts/project";
import log from "../../logger";
import type { ProjectHandlerContext } from "./types";

export const registerProjectCacheHandlers = (
    context: ProjectHandlerContext
): void => {
    ipcMain.handle(
        projectIpcContracts.materializeCacheImages.channel,
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
                    await context.projectService.materializeCacheImages(
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
