import { useCallback } from "react";
import { calculateFitCanvasState } from "@/renderer/main-window/utils/calculateFitCanvasState";

import { useAppStore } from "../store/useAppStore";

export const useFitToScreen = () => {
    const { imageSets, setCanvasState, clearSelection } = useAppStore();

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
