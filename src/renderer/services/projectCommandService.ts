import type { ProjectFile } from "../../shared/types/ProjectFile";
import type { ImageSet } from "../../shared/types/ImageSet";

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

        const savedPath = await ipcService.saveProjectAs(createProjectFile());
        if (savedPath) {
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

        ipcService.log.info(`Saving project to: ${currentProjectFilePath}`);
        await ipcService.saveProject(
            currentProjectFilePath,
            createProjectFile()
        );
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
