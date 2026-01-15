import { create } from "zustand";
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
    resetAll: () => void;
    loadProject: (project: ProjectFile<ImageSet>) => void;
};

type AppState = ProjectDataSlice & ViewSlice & InteractionSlice & StoreActions;

export const useAppStore = create<AppState>()((...args) => {
    const [, get] = args;
    return {
        ...createProjectDataSlice(...args),
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
        },

        resetAll: () => {
            get().resetProjectData();
            get().resetView();
            get().deselectAll();
            get().setInteractionMode("default");
        },
    };
});
