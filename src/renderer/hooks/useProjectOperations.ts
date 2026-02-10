import { useMemo } from "react";

import { createProjectCommandService } from "../services/projectCommandService";
import { getIPCService } from "../services/ipcService";
import { useAppStore } from "../store/useAppStore";

export const useProjectOperations = () => {
    const currentProjectFilePath = useAppStore(
        (state) => state.currentProjectFilePath
    );
    const loadProject = useAppStore((state) => state.loadProject);
    const resetAll = useAppStore((state) => state.resetAll);
    const setCurrentProjectFilePath = useAppStore(
        (state) => state.setCurrentProjectFilePath
    );

    const ipcService = getIPCService();

    const projectCommands = useMemo(
        () =>
            createProjectCommandService({
                ipcService,
                readSnapshot: () => {
                    const {
                        unitFactor,
                        unit,
                        windowColor,
                        canvas,
                        imageSets,
                        dimensionLines,
                    } = useAppStore.getState();

                    return {
                        unitFactor,
                        unit,
                        windowColor,
                        canvas,
                        imageSets,
                        dimensionLines,
                    };
                },
                readCurrentProjectFilePath: () =>
                    useAppStore.getState().currentProjectFilePath,
                mutations: {
                    loadProject,
                    resetAll,
                    setCurrentProjectFilePath,
                },
            }),
        [ipcService, loadProject, resetAll, setCurrentProjectFilePath]
    );

    return {
        currentProjectFilePath,
        handleNewProject: projectCommands.newProject,
        handleOpenProject: projectCommands.openProject,
        handleLoadProjectFromPath: projectCommands.openProjectFromPath,
        handleSaveProject: projectCommands.saveProject,
        handleSaveProjectAs: projectCommands.saveProjectAs,
    };
};
