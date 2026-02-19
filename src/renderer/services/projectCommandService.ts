import type { ProjectFile } from "../../shared/types/ProjectFile";
import type { ImageSet } from "../../shared/types/ImageSet";

import i18n from "../../i18n/configs";
import { fromLocalFileUrl, toLocalFileUrl } from "../factories/imageSetFactory";
import type { IIPCService } from "./ipcService";

type ProjectSnapshot = {
    unitFactor: number;
    unit: "nm" | "um" | "mm";
    windowColor: string;
    canvas: {
        x: number;
        y: number;
        scale: number;
    };
    imageSets: ImageSet[];
    dimensionLines: ProjectFile<ImageSet>["dimensionLines"];
};

type ProjectMutations = {
    loadProject: (project: ProjectFile<ImageSet>) => void;
    resetAll: () => void;
    setCurrentProjectFilePath: (filePath: string | null) => void;
    markProjectSaved: () => void;
    replaceImageSetsAfterSave: (imageSets: ImageSet[]) => void;
};

interface ProjectCommandServiceDeps {
    ipcService: IIPCService;
    readSnapshot: () => ProjectSnapshot;
    readCurrentProjectFilePath: () => string | null;
    mutations: ProjectMutations;
}

interface ProjectLoadResult {
    project: ProjectFile<ImageSet>;
    filePath: string;
}

export interface ProjectCommandService {
    createProjectFile: () => ProjectFile<ImageSet>;
    newProject: () => Promise<void>;
    openProject: () => Promise<void>;
    openProjectFromPath: (filePath: string) => Promise<void>;
    saveProject: () => Promise<void>;
    saveProjectAs: () => Promise<void>;
}

interface ResolvedProjectForSave {
    project: ProjectFile<ImageSet>;
    nextImageSets: ImageSet[] | null;
    cacheImagePathsToDelete: string[];
}

const buildProjectFile = (
    snapshot: ProjectSnapshot
): ProjectFile<ImageSet> => ({
    version: "1.0.0",
    window: {
        width: window.outerWidth,
        height: window.outerHeight,
        x: window.screenX,
        y: window.screenY,
        color: snapshot.windowColor,
    },
    settings: {
        unitFactor: snapshot.unitFactor,
        unit: snapshot.unit,
    },
    canvas: snapshot.canvas,
    images: snapshot.imageSets,
    dimensionLines: snapshot.dimensionLines,
});

const getCacheImageLocalPaths = (imageSets: ImageSet[]): string[] =>
    imageSets
        .filter((imageSet) => (imageSet.sourceType ?? "file") === "cache")
        .map((imageSet) => fromLocalFileUrl(imageSet.path))
        .filter((value): value is string => Boolean(value));

const applyProject = async (
    ipcService: IIPCService,
    mutations: ProjectMutations,
    loaded: ProjectLoadResult
): Promise<void> => {
    ipcService.log.info(`Applying project from: ${loaded.filePath}`);

    mutations.loadProject(loaded.project);

    const windowState = loaded.project.window;
    if (windowState) {
        await ipcService.setWindowRect({
            x: windowState.x,
            y: windowState.y,
            width: windowState.width,
            height: windowState.height,
        });
    }

    mutations.setCurrentProjectFilePath(loaded.filePath);
};

export const createProjectCommandService = ({
    ipcService,
    readSnapshot,
    readCurrentProjectFilePath,
    mutations,
}: ProjectCommandServiceDeps): ProjectCommandService => {
    const createProjectFile = (): ProjectFile<ImageSet> => {
        return buildProjectFile(readSnapshot());
    };

    const resolveProjectFileForSave = async (
        targetProjectFilePath: string,
        snapshot: ProjectSnapshot
    ): Promise<ResolvedProjectForSave | null> => {
        const cacheImagePaths = getCacheImageLocalPaths(snapshot.imageSets);
        if (cacheImagePaths.length === 0) {
            return {
                project: buildProjectFile(snapshot),
                nextImageSets: null,
                cacheImagePathsToDelete: [],
            };
        }

        const shouldMaterialize = window.confirm(
            i18n.t("render.project_save.cache_warning.confirm_move")
        );
        if (!shouldMaterialize) {
            await ipcService.toggleImageSettingsWindow();
            return null;
        }

        const replacementMap = await ipcService.materializeCacheImages(
            targetProjectFilePath,
            cacheImagePaths
        );
        const missingPaths = cacheImagePaths.filter(
            (path) => !replacementMap[path]
        );
        if (missingPaths.length > 0) {
            throw new Error(
                `Failed to materialize cache images: ${missingPaths.join(", ")}`
            );
        }

        const nextImageSets = snapshot.imageSets.map((imageSet) => {
            if ((imageSet.sourceType ?? "file") !== "cache") {
                return imageSet;
            }

            const sourcePath = fromLocalFileUrl(imageSet.path);
            if (!sourcePath) {
                return imageSet;
            }

            const destinationPath = replacementMap[sourcePath];
            if (!destinationPath) {
                return imageSet;
            }

            return {
                ...imageSet,
                path: toLocalFileUrl(destinationPath),
                sourceType: "file" as const,
            };
        });

        return {
            project: buildProjectFile({
                ...snapshot,
                imageSets: nextImageSets,
            }),
            nextImageSets,
            cacheImagePathsToDelete: [...new Set(cacheImagePaths)],
        };
    };

    const newProject = async (): Promise<void> => {
        ipcService.log.info("New project requested");
        mutations.resetAll();
        mutations.setCurrentProjectFilePath(null);
    };

    const openProject = async (): Promise<void> => {
        const loaded = await ipcService.loadProject();
        if (!loaded) {
            return;
        }

        await applyProject(ipcService, mutations, loaded);
    };

    const openProjectFromPath = async (filePath: string): Promise<void> => {
        const loaded = await ipcService.loadProjectFromPath(filePath);
        if (!loaded) {
            return;
        }

        await applyProject(ipcService, mutations, loaded);
    };

    const saveProjectAs = async (): Promise<void> => {
        ipcService.log.info("Save Project As requested");
        const snapshot = readSnapshot();
        const hasCacheImages =
            getCacheImageLocalPaths(snapshot.imageSets).length > 0;

        if (!hasCacheImages) {
            const savedPath = await ipcService.saveProjectAs(
                buildProjectFile(snapshot)
            );
            if (savedPath) {
                mutations.setCurrentProjectFilePath(savedPath);
                mutations.markProjectSaved();
            }
            return;
        }

        const savedPath = await ipcService.pickProjectSavePath();
        if (savedPath) {
            const projectForSave = await resolveProjectFileForSave(
                savedPath,
                snapshot
            );
            if (!projectForSave) {
                return;
            }

            await ipcService.saveProject(
                savedPath,
                projectForSave.project,
                projectForSave.cacheImagePathsToDelete.length > 0
                    ? projectForSave.cacheImagePathsToDelete
                    : undefined
            );
            if (projectForSave.nextImageSets) {
                mutations.replaceImageSetsAfterSave(
                    projectForSave.nextImageSets
                );
            }
            mutations.setCurrentProjectFilePath(savedPath);
            mutations.markProjectSaved();
        }
    };

    const saveProject = async (): Promise<void> => {
        const currentProjectFilePath = readCurrentProjectFilePath();
        if (!currentProjectFilePath) {
            await saveProjectAs();
            return;
        }

        const snapshot = readSnapshot();
        const projectForSave = await resolveProjectFileForSave(
            currentProjectFilePath,
            snapshot
        );
        if (!projectForSave) {
            return;
        }

        ipcService.log.info(`Saving project to: ${currentProjectFilePath}`);
        await ipcService.saveProject(
            currentProjectFilePath,
            projectForSave.project,
            projectForSave.cacheImagePathsToDelete.length > 0
                ? projectForSave.cacheImagePathsToDelete
                : undefined
        );
        if (projectForSave.nextImageSets) {
            mutations.replaceImageSetsAfterSave(projectForSave.nextImageSets);
        }
        mutations.markProjectSaved();
    };

    return {
        createProjectFile,
        newProject,
        openProject,
        openProjectFromPath,
        saveProject,
        saveProjectAs,
    };
};
