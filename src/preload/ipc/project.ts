import {
    projectIpcContracts,
    sceneIpcContracts,
} from "../../shared/ipc/contracts";
import type { ImageSet } from "../../shared/types/ImageSet";
import type { ProjectFile } from "../../shared/types/ProjectFile";
import type { ResolvedSceneFile } from "../../shared/types/SceneFile";
import { invokeIpcContract } from "./client";

export const createProjectApi = () => ({
    saveProjectAs: (project: ProjectFile<ImageSet>) =>
        invokeIpcContract(projectIpcContracts.saveAs, project),
    saveProject: (
        filePath: string,
        project: ProjectFile<ImageSet>,
        cacheImagePathsToDelete?: string[]
    ) =>
        invokeIpcContract(projectIpcContracts.save, {
            filePath,
            project,
            cacheImagePathsToDelete,
        }),
    pickProjectSavePath: () =>
        invokeIpcContract(projectIpcContracts.pickSavePath),
    materializeCacheImages: (
        projectFilePath: string,
        cacheImagePaths: string[]
    ): Promise<Record<string, string>> =>
        invokeIpcContract(projectIpcContracts.materializeCacheImages, {
            projectFilePath,
            cacheImagePaths,
        }),
    loadProject: () => invokeIpcContract(projectIpcContracts.load),
    loadProjectFromPath: (filePath: string) =>
        invokeIpcContract(projectIpcContracts.loadFromPath, filePath),
    loadSceneFromPath: (filePath: string): Promise<ResolvedSceneFile> =>
        invokeIpcContract(sceneIpcContracts.loadFromPath, filePath),
});
