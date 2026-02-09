import { create } from "zustand";
import { temporal } from "zundo";
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

type AppState = ProjectDataSlice & ViewSlice & InteractionSlice & StoreActions;

// AppStore definition
export const useAppStore = create<AppState>()(
    temporal(
        (...args) => {
            const [, get] = args;
            const ipcService = getIPCService();
            return {
                ...createProjectDataSlice(
                    ipcService,
                    () =>
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        (useAppStore as any).temporal
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
                    useAppStore.temporal.getState().clear();
                },

                resetAll: () => {
                    get().resetProjectData();
                    get().resetView();
                    get().deselectAll();
                    get().setInteractionMode("default");

                    // 履歴をクリア
                    useAppStore.temporal.getState().clear();
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
