import {
    projectIpcContracts,
    sceneIpcContracts,
} from "../../shared/ipc/contracts";
import type { ImageSet } from "../../shared/types/ImageSet";
import type { LaunchIntent } from "../../shared/types/LaunchIntent";
import type { ProjectFile } from "../../shared/types/ProjectFile";
import { invokeIpcContract } from "./client";

/**
 * プロジェクト管理およびシーン(構成情報)管理に関するIPC通信APIの構築関数
 */
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
    loadSceneFromPath: (filePath: string): Promise<LaunchIntent> =>
        invokeIpcContract(sceneIpcContracts.loadFromPath, filePath),
});
