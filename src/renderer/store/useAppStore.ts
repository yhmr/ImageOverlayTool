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
import { getIPCService } from "../services/ipcService";

type StoreActions = {
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
            const [, get] = args;
            const ipcService = getIPCService();
            const clearHistory = () => {
                temporalStoreRef.current?.getState().clear();
            };

            return {
                ...createProjectDataSlice(
                    ipcService,
                    () => temporalStoreRef.current
                )(...args),
                ...createViewSlice(...args),
                ...createInteractionSlice(...args),

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
