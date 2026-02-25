import { IPC_CHANNELS } from "../../shared/ipc/channels";
import type { ProjectFile } from "../../shared/types/ProjectFile";
import type { ResolvedSceneFile } from "../../shared/types/SceneFile";
import { invokeIpc } from "./client";

export const createProjectApi = () => ({
    saveProjectAs: (project: ProjectFile) =>
        invokeIpc(IPC_CHANNELS.project.saveAs, project),
    saveProject: (
        filePath: string,
        project: ProjectFile,
        cacheImagePathsToDelete?: string[]
    ) =>
        invokeIpc(IPC_CHANNELS.project.save, {
            filePath,
            project,
            cacheImagePathsToDelete,
        }),
    pickProjectSavePath: () =>
        invokeIpc<string | null>(IPC_CHANNELS.project.pickSavePath),
    materializeCacheImages: (
        projectFilePath: string,
        cacheImagePaths: string[]
    ): Promise<Record<string, string>> =>
        invokeIpc(IPC_CHANNELS.project.materializeCacheImages, {
            projectFilePath,
            cacheImagePaths,
        }),
    loadProject: () => invokeIpc(IPC_CHANNELS.project.load),
    loadProjectFromPath: (filePath: string) =>
        invokeIpc(IPC_CHANNELS.project.loadFromPath, filePath),
    loadSceneFromPath: (filePath: string): Promise<ResolvedSceneFile> =>
        invokeIpc(IPC_CHANNELS.scene.loadFromPath, filePath),
});
