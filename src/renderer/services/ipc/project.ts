import type { ImageSet } from "../../../shared/types/ImageSet";
import type { ProjectFile } from "../../../shared/types/ProjectFile";
import { getElectronApi } from "./electronApi";
import type { IElectronAPI } from "../../../shared/ipc/electronApi";
import type {
    MaterializeCacheImagesPayload,
    SaveProjectPayload,
} from "../../../shared/ipc/contracts/project";
import type { InvokeResult } from "../../../shared/ipc/contract";
import { projectIpcContracts } from "../../../shared/ipc/contracts";

/**
 * レンダラープロセス内でプロジェクトおよびシーン制御通信を担うサービスのインターフェース
 */
type ProjectIPCService = {
    saveProjectAs: IElectronAPI["saveProjectAs"];
    pickProjectSavePath: IElectronAPI["pickProjectSavePath"];
    materializeCacheImages: (
        projectFilePath: MaterializeCacheImagesPayload["projectFilePath"],
        cacheImagePaths: MaterializeCacheImagesPayload["cacheImagePaths"]
    ) => Promise<
        InvokeResult<typeof projectIpcContracts.materializeCacheImages>
    >;
    saveProject: (
        filePath: SaveProjectPayload["filePath"],
        project: SaveProjectPayload["project"],
        cacheImagePathsToDelete?: SaveProjectPayload["cacheImagePathsToDelete"]
    ) => Promise<InvokeResult<typeof projectIpcContracts.save>>;
    loadProject: IElectronAPI["loadProject"];
    loadProjectFromPath: IElectronAPI["loadProjectFromPath"];
    loadSceneFromPath: IElectronAPI["loadSceneFromPath"];
};

/**
 * プロジェクト管理IPC通信サービスを生成して返します。
 */
export const createProjectIPCService = (): ProjectIPCService => ({
    saveProjectAs: (project: ProjectFile<ImageSet>) =>
        getElectronApi().saveProjectAs(project),
    pickProjectSavePath: () => getElectronApi().pickProjectSavePath(),
    materializeCacheImages: (
        projectFilePath: string,
        cacheImagePaths: string[]
    ) =>
        getElectronApi().materializeCacheImages({
            projectFilePath,
            cacheImagePaths,
        }),
    saveProject: (
        filePath: string,
        project: ProjectFile<ImageSet>,
        cacheImagePathsToDelete?: string[]
    ) =>
        getElectronApi().saveProject({
            filePath,
            project,
            cacheImagePathsToDelete,
        }),
    loadProject: () => getElectronApi().loadProject(),
    loadProjectFromPath: (filePath: string) =>
        getElectronApi().loadProjectFromPath(filePath),
    loadSceneFromPath: (filePath: string) =>
        getElectronApi().loadSceneFromPath(filePath),
});
