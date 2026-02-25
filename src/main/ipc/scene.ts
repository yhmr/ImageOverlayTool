import { ipcMain } from "electron";

import { sceneIpcContracts } from "../../shared/ipc/contracts";
import type { ResolvedSceneFile } from "../../shared/types/SceneFile";
import { loadResolvedSceneFileFromPath } from "../repositories/sceneLoader";
import log from "../logger";

export const registerSceneHandlers = (): void => {
    ipcMain.handle(
        sceneIpcContracts.loadFromPath.channel,
        async (_event, scenePath: string): Promise<ResolvedSceneFile> => {
            log.debug(`[IPC] scene:loadFromPath called for: ${scenePath}`);

            if (!scenePath || typeof scenePath !== "string") {
                throw new Error("Invalid payload for scene:loadFromPath");
            }

            const resolved = await loadResolvedSceneFileFromPath(scenePath);

            log.info(`[IPC] scene:loadFromPath completed: ${scenePath}`);
            return resolved;
        }
    );
};
