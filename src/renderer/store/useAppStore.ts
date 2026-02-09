import { create, type StoreApi } from "zustand";
import { temporal, type TemporalState } from "zundo";
import {
    ProjectDataSlice,
    createProjectDataSlice,
} from "./slices/createProjectDataSlice";
import { ViewSlice, createViewSlice } from "./slices/createViewSlice";
import {
    InteractionSlice,
    createInteractionSlice,
} from "./slices/createInteractionSlice";

import { ProjectFile } from "../../shared/types/ProjectFile";
import { ImageSet } from "../../shared/types/ImageSet";

type StoreActions = {
    currentProjectFilePath: string | null;
    setCurrentProjectFilePath: (filePath: string | null) => void;
    resetAll: () => void;
    loadProject: (project: ProjectFile<ImageSet>) => void;
};

export type AppState = ProjectDataSlice &
    ViewSlice &
    InteractionSlice &
    StoreActions;

const temporalStoreRef: {
    current: StoreApi<TemporalState<unknown>> | undefined;
} = {
    current: undefined,
};

// AppStore definition
export const useAppStore = create<AppState>()(
    temporal(
        (...args) => {
            const [set, get] = args;
            const clearHistory = () => {
                temporalStoreRef.current?.getState().clear();
            };

            return {
                ...createProjectDataSlice(() => temporalStoreRef.current)(
                    ...args
                ),
                ...createViewSlice(...args),
                ...createInteractionSlice(...args),

                currentProjectFilePath: null,
                setCurrentProjectFilePath: (filePath: string | null) =>
                    set({ currentProjectFilePath: filePath }),

                loadProject: (project: ProjectFile<ImageSet>) => {
                    // プロジェクトデータをロード (ProjectDataSlice)
                    get().loadProjectData(project);
                    // View情報をロード (ViewSlice)
                    if (project.canvas) {
                        get().setCanvasState(project.canvas);
                    } else {
                        get().resetView();
                    }
                    // 選択状態などをリセット
                    get().deselectAll();
                    get().setInteractionMode("default");

                    // 履歴をクリア
                    clearHistory();
                },

                resetAll: () => {
                    get().resetProjectData();
                    get().resetView();
                    get().deselectAll();
                    get().setInteractionMode("default");
                    get().setCurrentProjectFilePath(null);

                    // 履歴をクリア
                    clearHistory();
                },
            };
        },
        {
            partialize: (state) => {
                const {
                    imageSets,
                    dimensionLines,
                    unitFactor,
                    unit,
                    windowColor,
                } = state;
                return {
                    imageSets,
                    dimensionLines,
                    unitFactor,
                    unit,
                    windowColor,
                };
            },
            limit: 50,
        }
    )
);

temporalStoreRef.current = useAppStore.temporal;
