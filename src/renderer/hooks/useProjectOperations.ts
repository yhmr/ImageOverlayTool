import { useMemo } from "react";

import { useIpcService } from "../providers/IpcServiceProvider";
import { createProjectCommandService } from "../services/projectCommandService";
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

    const ipcService = useIpcService();

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
        newProject: projectCommands.newProject,
        openProject: projectCommands.openProject,
        openProjectFromPath: projectCommands.openProjectFromPath,
        saveProject: projectCommands.saveProject,
        saveProjectAs: projectCommands.saveProjectAs,
    };
};
