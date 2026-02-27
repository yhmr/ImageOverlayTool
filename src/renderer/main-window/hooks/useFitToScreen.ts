import { useCallback } from "react";
import { calculateFitCanvasState } from "@/renderer/main-window/utils/calculateFitCanvasState";

import { useAppStore } from "../../store/useAppStore";
import {
    selectClearSelection,
    selectImageSets,
    selectSetCanvasState,
} from "../../store/selectors";

export const useFitToScreen = () => {
    const imageSets = useAppStore(selectImageSets);
    const setCanvasState = useAppStore(selectSetCanvasState);
    const clearSelection = useAppStore(selectClearSelection);

    const fitToScreen = useCallback(() => {
        const container = document.querySelector(
            ".image-area"
        ) as HTMLDivElement | null;

        if (!container) {
            return;
        }

        const fitCanvasState = calculateFitCanvasState({
            imageSets,
            viewportWidth: container.offsetWidth,
            viewportHeight: container.offsetHeight,
        });

        if (!fitCanvasState) {
            return;
        }

        clearSelection();
        setCanvasState(fitCanvasState);
    }, [clearSelection, imageSets, setCanvasState]);

    return { fitToScreen };
};
