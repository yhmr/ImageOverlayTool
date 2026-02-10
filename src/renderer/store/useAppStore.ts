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

type UndoSnapshot = Pick<
    AppState,
    "imageSets" | "dimensionLines" | "unitFactor" | "unit" | "windowColor"
>;

export type AppState = ProjectDataSlice &
    ViewSlice &
    InteractionSlice &
    StoreActions;

const temporalStoreRef: {
    current: StoreApi<TemporalState<unknown>> | undefined;
} = {
    current: undefined,
};

const isSameUndoSnapshot = (
    pastState: Partial<UndoSnapshot>,
    currentState: Partial<UndoSnapshot>
): boolean => {
    return (
        pastState.imageSets === currentState.imageSets &&
        pastState.dimensionLines === currentState.dimensionLines &&
        pastState.unitFactor === currentState.unitFactor &&
        pastState.unit === currentState.unit &&
        pastState.windowColor === currentState.windowColor
    );
};

// AppStore definition
export const useAppStore = create<AppState>()(
    temporal(
        (...args) => {
            const [set, get] = args;
            const clearHistory = () => {
                temporalStoreRef.current?.getState().clear();
            };

            const withHistoryPaused = (fn: () => void) => {
                const temporalState = temporalStoreRef.current?.getState();
                temporalState?.pause();
                try {
                    fn();
                } finally {
                    temporalState?.resume();
                }
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
                    withHistoryPaused(() => {
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
                    });

                    // 履歴をクリア
                    clearHistory();
                },

                resetAll: () => {
                    withHistoryPaused(() => {
                        get().resetProjectData();
                        get().resetView();
                        get().deselectAll();
                        get().setInteractionMode("default");
                        get().setCurrentProjectFilePath(null);
                    });

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
            equality: isSameUndoSnapshot,
            limit: 50,
        }
    )
);

temporalStoreRef.current = useAppStore.temporal;
