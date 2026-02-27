import type { ImageSet } from "../../../shared/types/ImageSet";
import type { ProjectFile } from "../../../shared/types/ProjectFile";

import type { IIPCService } from "../../services/ipcService";
import {
    buildProjectFile,
    type ProjectSnapshot,
    type ProjectWindowState,
} from "./project/buildProjectFile";
import {
    getCacheImageLocalPaths,
    resolveCacheImagePaths,
} from "./project/resolveCacheImages";

type ProjectMutations = {
    loadProject: (project: ProjectFile<ImageSet>) => void;
    resetAll: () => void;
    setCurrentProjectFilePath: (filePath: string | null) => void;
    markProjectSaved: () => void;
    replaceImageSetsAfterSave: (imageSets: ImageSet[]) => void;
};

interface ProjectCommandServiceDeps {
    ipcService: IIPCService;
    // Storeから現在のプロジェクトデータ（スナップショット）を取得する関数
    readSnapshot: () => ProjectSnapshot;
    // 現在開いているプロジェクトファイルのパスを取得する関数
    readCurrentProjectFilePath: () => string | null;
    // ウィンドウの現在の状態（位置・サイズ等）を取得する関数
    readWindowState: () => ProjectWindowState;
    confirmCacheImageMaterialization: () => Promise<boolean>;
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
    readWindowState,
    confirmCacheImageMaterialization,
    mutations,
}: ProjectCommandServiceDeps): ProjectCommandService => {
    // ウィンドウ状態(readWindowState())を外部から注入・合成する
    const createProjectFile = (): ProjectFile<ImageSet> => {
        return buildProjectFile(readSnapshot(), readWindowState());
    };

    const resolveProjectFileForSave = async (
        targetProjectFilePath: string,
        snapshot: ProjectSnapshot
    ): Promise<ResolvedProjectForSave | null> => {
        const cacheImagePaths = getCacheImageLocalPaths(snapshot.imageSets);
        if (cacheImagePaths.length === 0) {
            return {
                project: buildProjectFile(snapshot, readWindowState()),
                nextImageSets: null,
                cacheImagePathsToDelete: [],
            };
        }

        const shouldMaterialize = await confirmCacheImageMaterialization();
        if (!shouldMaterialize) {
            await ipcService.toggleImageSettingsWindow();
            return null;
        }

        const replacementMap = await ipcService.materializeCacheImages(
            targetProjectFilePath,
            cacheImagePaths
        );
        // キャッシュ画像の解決処理結果を受け取る
        const resolution = resolveCacheImagePaths(
            snapshot.imageSets,
            replacementMap,
            cacheImagePaths
        );
        if (resolution.missingPaths.length > 0) {
            throw new Error(
                `Failed to materialize cache images: ${resolution.missingPaths.join(
                    ", "
                )}`
            );
        }

        return {
            // buildProjectFile にウィンドウ状態を渡す
            project: buildProjectFile(
                {
                    ...snapshot,
                    imageSets: resolution.nextImageSets,
                },
                readWindowState()
            ),
            nextImageSets: resolution.nextImageSets,
            cacheImagePathsToDelete: resolution.cacheImagePathsToDelete,
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
                buildProjectFile(snapshot, readWindowState())
            );
            if (savedPath) {
                mutations.setCurrentProjectFilePath(savedPath);
                mutations.markProjectSaved();
            }
            return;
        }

        const savedPath = await ipcService.pickProjectSavePath();
        if (!savedPath) {
            return;
        }

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
            mutations.replaceImageSetsAfterSave(projectForSave.nextImageSets);
        }
        mutations.setCurrentProjectFilePath(savedPath);
        mutations.markProjectSaved();
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
