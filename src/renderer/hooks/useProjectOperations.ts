import { useMemo } from "react";

import i18n from "../../i18n/configs";
import { useIpcService } from "../providers/IpcServiceProvider";
import { createProjectCommandService } from "../services/projectCommandService";
import { useAppStore } from "../store/useAppStore";
import {
    selectCurrentProjectFilePath,
    selectHasUnsavedChanges,
    selectLoadProject,
    selectMarkProjectSaved,
    selectReplaceImageSetsAfterSave,
    selectResetAll,
    selectSetCurrentProjectFilePath,
} from "../store/selectors";

export const useProjectOperations = () => {
    const currentProjectFilePath = useAppStore(selectCurrentProjectFilePath);
    const hasUnsavedChanges = useAppStore(selectHasUnsavedChanges);
    const loadProject = useAppStore(selectLoadProject);
    const resetAll = useAppStore(selectResetAll);
    const setCurrentProjectFilePath = useAppStore(
        selectSetCurrentProjectFilePath
    );
    const markProjectSaved = useAppStore(selectMarkProjectSaved);
    const replaceImageSetsAfterSave = useAppStore(
        selectReplaceImageSetsAfterSave
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
                    markProjectSaved,
                    replaceImageSetsAfterSave,
                },
            }),
        [
            ipcService,
            loadProject,
            resetAll,
            setCurrentProjectFilePath,
            markProjectSaved,
            replaceImageSetsAfterSave,
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
