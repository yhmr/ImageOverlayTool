import { ipcMain } from "electron";
import { e2eIpcContracts } from "../../../shared/ipc/contracts";
import { parseE2ESceneExtensions } from "../../repositories/e2eSceneExtensions";
import { loadResolvedSceneDocumentFromPath } from "../../repositories/sceneLoader";
import { resolveSceneSourcePath } from "../../repositories/sceneResolver";
import type {
    E2ELoadFixtureImageRequest,
    E2EResolvedFixtureImage,
    E2EResolvedSceneFile,
    E2ESceneExtensions,
} from "../../../shared/types/E2EControl";
import type { E2EControlHandlerContext } from "./types";

export const registerE2ESceneHandlers = (
    context: E2EControlHandlerContext
): void => {
    ipcMain.handle(
        e2eIpcContracts.setSceneFromPath.channel,
        async (_event, scenePath: string): Promise<E2EResolvedSceneFile> => {
            context.assertControlPlaneEnabled();
            if (
                typeof scenePath !== "string" ||
                scenePath.trim().length === 0
            ) {
                throw new Error("Invalid payload for e2e:setSceneFromPath");
            }
            const sceneDocument = await loadResolvedSceneDocumentFromPath(
                scenePath.trim(),
                {
                    imagePathAliases: context.e2eImagePathAliases,
                }
            );
            const extensions: E2ESceneExtensions = parseE2ESceneExtensions(
                sceneDocument.source
            );

            return {
                ...sceneDocument.resolvedScene,
                ...extensions,
            };
        }
    );

    ipcMain.handle(
        e2eIpcContracts.loadFixtureImage.channel,
        (
            _event,
            request: E2ELoadFixtureImageRequest
        ): E2EResolvedFixtureImage => {
            context.assertControlPlaneEnabled();
            return {
                path: resolveSceneSourcePath(
                    request.source,
                    context.e2eConfig.fixturesDir,
                    {
                        imagePathAliases: context.e2eImagePathAliases,
                    }
                ),
            };
        }
    );
};
