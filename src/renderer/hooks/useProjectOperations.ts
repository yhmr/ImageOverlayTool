import { useCallback, useState } from "react";
import { useAppStore } from "../store/useAppStore";
import { ProjectFile } from "../../shared/types/ProjectFile";
import { ImageSet } from "../../shared/types/ImageSet";

export const useProjectOperations = () => {
    const {
        unitFactor,
        windowColor,
        canvas,
        dimensionLines,
        imageSets,
        loadProject,
        resetAll,
    } = useAppStore();

    const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);

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
            settings: { unitFactor },
            canvas,
            images: imageSets,
            dimensionLines,
        }),
        [imageSets, unitFactor, windowColor, canvas, dimensionLines]
    );

    const handleNewProject = useCallback(async () => {
        resetAll();
        setCurrentFilePath(null);
    }, [resetAll]);

    const applyProject = useCallback(
        async (project: ProjectFile<ImageSet>, filePath: string) => {
            loadProject(project);
            if (project.window) {
                await window.electronAPI.setWindowRect({
                    x: project.window.x,
                    y: project.window.y,
                    width: project.window.width,
                    height: project.window.height,
                });
            }
            setCurrentFilePath(filePath);
        },
        [loadProject]
    );

    const handleOpenProject = useCallback(async () => {
        const result = await window.electronAPI.loadProject();
        if (result) {
            await applyProject(
                result.project as ProjectFile<ImageSet>,
                result.filePath
            );
        }
    }, [applyProject]);

    const handleLoadProjectFromPath = useCallback(
        async (path: string) => {
            const result = await window.electronAPI.loadProjectFromPath(path);
            if (result) {
                await applyProject(
                    result.project as ProjectFile<ImageSet>,
                    result.filePath
                );
            }
        },
        [applyProject]
    );

    const handleSaveProjectAs = useCallback(async () => {
        const project = createProjectFile();
        const filePath = await window.electronAPI.saveProjectAs(project);
        if (filePath) {
            setCurrentFilePath(filePath);
        }
    }, [createProjectFile]);

    const handleSaveProject = useCallback(async () => {
        if (!currentFilePath) {
            await handleSaveProjectAs();
            return;
        }
        const project = createProjectFile();
        await window.electronAPI.saveProject(currentFilePath, project);
    }, [currentFilePath, createProjectFile, handleSaveProjectAs]);

    return {
        currentFilePath,
        handleNewProject,
        handleOpenProject,
        handleLoadProjectFromPath,
        handleSaveProject,
        handleSaveProjectAs,
    };
};
