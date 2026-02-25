import type { E2EResolvedSceneFile } from "../../shared/types/E2EControl";
import { runAsSystemMutation } from "../store/temporalHistory";
import { useAppStore } from "../store/useAppStore";
import { applyResolvedSceneFile } from "./sceneFileApplicator";

const applySceneExtensions = (scene: E2EResolvedSceneFile): void => {
    runAsSystemMutation(
        () => useAppStore.temporal,
        () => {
            const state = useAppStore.getState();
            if (scene.uiHidden !== undefined) {
                state.setUIHidden(scene.uiHidden);
            }
            if (scene.interactionMode !== undefined) {
                state.setInteractionMode(scene.interactionMode);
            }
            if (scene.selectedDimensionLineId !== undefined) {
                state.setSelectedDimensionLineId(scene.selectedDimensionLineId);
            }
            if (scene.selectedImageId !== undefined) {
                state.setSelectedImageId(scene.selectedImageId);
            }
            state.markProjectSaved();
        }
    );
};

export const applyResolvedE2ESceneFile = (
    scene: E2EResolvedSceneFile
): void => {
    applyResolvedSceneFile(scene);
    applySceneExtensions(scene);
};
