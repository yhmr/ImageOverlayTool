import type { ImageSet } from "../../../shared/types/ImageSet";
import type { ProjectFile } from "../../../shared/types/ProjectFile";
import { getElectronApi } from "./electronApi";
import type { IElectronAPI } from "../../../shared/ipc/electronApi";

type ProjectIPCService = Pick<
    IElectronAPI,
    | "saveProjectAs"
    | "pickProjectSavePath"
    | "materializeCacheImages"
    | "saveProject"
    | "loadProject"
    | "loadProjectFromPath"
    | "loadSceneFromPath"
>;

export const createProjectIPCService = (): ProjectIPCService => ({
    saveProjectAs: (project: ProjectFile<ImageSet>) =>
        getElectronApi().saveProjectAs(project),
    pickProjectSavePath: () => getElectronApi().pickProjectSavePath(),
    materializeCacheImages: (
        projectFilePath: string,
        cacheImagePaths: string[]
    ) =>
        getElectronApi().materializeCacheImages(
            projectFilePath,
            cacheImagePaths
        ),
    saveProject: (
        filePath: string,
        project: ProjectFile<ImageSet>,
        cacheImagePathsToDelete?: string[]
    ) =>
        getElectronApi().saveProject(
            filePath,
            project,
            cacheImagePathsToDelete
        ),
    loadProject: () => getElectronApi().loadProject(),
    loadProjectFromPath: (filePath: string) =>
        getElectronApi().loadProjectFromPath(filePath),
    loadSceneFromPath: (filePath: string) =>
        getElectronApi().loadSceneFromPath(filePath),
});
