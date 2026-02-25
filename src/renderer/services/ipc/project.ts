import type { ImageSet } from "../../../shared/types/ImageSet";
import type { ProjectFile } from "../../../shared/types/ProjectFile";
import { getElectronApi } from "./electronApi";
import type { IProjectIPCService } from "./types";

export const createProjectIPCService = (): IProjectIPCService => ({
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
