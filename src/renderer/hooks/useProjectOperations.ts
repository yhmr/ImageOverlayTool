import { useMemo } from "react";

import i18n from "../../i18n/configs";
import { useIpcService } from "../providers/IpcServiceProvider";
import { createProjectCommandService } from "../services/projectCommandService";
import { useAppStore } from "../store/useAppStore";

export const useProjectOperations = () => {
    const currentProjectFilePath = useAppStore(
        (state) => state.currentProjectFilePath
    );
    const hasUnsavedChanges = useAppStore((state) => state.hasUnsavedChanges);
    const loadProject = useAppStore((state) => state.loadProject);
    const resetAll = useAppStore((state) => state.resetAll);
    const setCurrentProjectFilePath = useAppStore(
        (state) => state.setCurrentProjectFilePath
    );
    const markProjectSaved = useAppStore((state) => state.markProjectSaved);

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
                    markProjectSaved,
                },
            }),
        [
            ipcService,
            loadProject,
            resetAll,
            setCurrentProjectFilePath,
            markProjectSaved,
        ]
    );

    const confirmDiscardUnsavedChanges = (): boolean => {
        if (!hasUnsavedChanges) {
            return true;
        }

        try {
            return window.confirm(
                i18n.t("render.unsaved_changes.confirm_discard")
            );
        } catch {
            return true;
        }
    };

    return {
        currentProjectFilePath,
        newProject: async () => {
            if (!confirmDiscardUnsavedChanges()) {
                return;
            }
            await projectCommands.newProject();
        },
        openProject: async () => {
            if (!confirmDiscardUnsavedChanges()) {
                return;
            }
            await projectCommands.openProject();
        },
        openProjectFromPath: async (filePath: string) => {
            if (!confirmDiscardUnsavedChanges()) {
                return;
            }
            await projectCommands.openProjectFromPath(filePath);
        },
        saveProject: projectCommands.saveProject,
        saveProjectAs: projectCommands.saveProjectAs,
    };
};
