import { useCallback } from "react";
import { useAppStore } from "../store/useAppStore";
import { ProjectFile } from "../../shared/types/ProjectFile";
import { ImageSet } from "../../shared/types/ImageSet";
import { getIPCService } from "../services/ipcService";

export const useProjectOperations = () => {
    const {
        unitFactor,
        unit,
        windowColor,
        canvas,
        dimensionLines,
        imageSets,
        currentProjectFilePath,
        setCurrentProjectFilePath,
        loadProject,
        resetAll,
    } = useAppStore();

    const ipcService = getIPCService();

    const createProjectFile = useCallback(
        (): ProjectFile<ImageSet> => ({
            version: "1.0.0",
            window: {
                width: window.outerWidth,
                height: window.outerHeight,
                x: window.screenX,
                y: window.screenY,
                color: windowColor,
            },
            settings: { unitFactor, unit },
            canvas,
            images: imageSets,
            dimensionLines,
        }),
        [imageSets, unitFactor, unit, windowColor, canvas, dimensionLines]
    );

    const handleNewProject = useCallback(async () => {
        ipcService.log.info("New project requested");
        resetAll();
        setCurrentProjectFilePath(null);
    }, [resetAll, setCurrentProjectFilePath, ipcService]);

    const applyProject = useCallback(
        async (project: ProjectFile<ImageSet>, filePath: string) => {
            ipcService.log.info(`Applying project from: ${filePath}`);
            loadProject(project);
            if (project.window) {
                await ipcService.setWindowRect({
                    x: project.window.x,
                    y: project.window.y,
                    width: project.window.width,
                    height: project.window.height,
                });
            }
            setCurrentProjectFilePath(filePath);
        },
        [loadProject, setCurrentProjectFilePath, ipcService]
    );

    const handleOpenProject = useCallback(async () => {
        const result = await ipcService.loadProject();
        if (result) {
            await applyProject(result.project, result.filePath);
        }
    }, [applyProject, ipcService]);

    const handleLoadProjectFromPath = useCallback(
        async (path: string) => {
            const result = await ipcService.loadProjectFromPath(path);
            if (result) {
                await applyProject(result.project, result.filePath);
            }
        },
        [applyProject, ipcService]
    );

    const handleSaveProjectAs = useCallback(async () => {
        ipcService.log.info("Save Project As requested");
        const project = createProjectFile();
        const filePath = await ipcService.saveProjectAs(project);
        if (filePath) {
            setCurrentProjectFilePath(filePath);
        }
    }, [createProjectFile, setCurrentProjectFilePath, ipcService]);

    const handleSaveProject = useCallback(async () => {
        if (!currentProjectFilePath) {
            await handleSaveProjectAs();
            return;
        }
        const project = createProjectFile();
        ipcService.log.info(`Saving project to: ${currentProjectFilePath}`);
        await ipcService.saveProject(currentProjectFilePath, project);
    }, [
        currentProjectFilePath,
        createProjectFile,
        handleSaveProjectAs,
        ipcService,
    ]);

    return {
        currentFilePath: currentProjectFilePath,
        handleNewProject,
        handleOpenProject,
        handleLoadProjectFromPath,
        handleSaveProject,
        handleSaveProjectAs,
    };
};
