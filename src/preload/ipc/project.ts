import {
    projectIpcContracts,
    sceneIpcContracts,
} from "../../shared/ipc/contracts";
import type {
    MaterializeCacheImagesPayload,
    SaveProjectPayload,
} from "../../shared/ipc/contracts/project";
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
    saveProject: (payload: SaveProjectPayload) =>
        invokeIpcContract(projectIpcContracts.save, payload),
    pickProjectSavePath: () =>
        invokeIpcContract(projectIpcContracts.pickSavePath),
    materializeCacheImages: (payload: MaterializeCacheImagesPayload) =>
        invokeIpcContract(projectIpcContracts.materializeCacheImages, payload),
    loadProject: () => invokeIpcContract(projectIpcContracts.load),
    loadProjectFromPath: (filePath: string) =>
        invokeIpcContract(projectIpcContracts.loadFromPath, filePath),
    loadSceneFromPath: (filePath: string): Promise<LaunchIntent> =>
        invokeIpcContract(sceneIpcContracts.loadFromPath, filePath),
});
