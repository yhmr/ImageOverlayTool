import { useEffect, useRef } from "react";

import { useIpcService } from "../providers/IpcServiceProvider";
import {
    createProjectSyncBridge,
    type ProjectSyncBridge,
} from "../services/sync/createProjectSyncBridge";
import {
    createSyncBroadcaster,
    type ProjectSyncSnapshot,
} from "../services/sync/syncBroadcaster";
import { useAppStore } from "../store/useAppStore";
import {
    selectDimensionLines,
    selectImageSets,
    selectInteractionMode,
    selectProjectDataChangeOrigin,
    selectSelectedDimensionLineId,
    selectSelectedImageId,
    selectUnit,
    selectUnitFactor,
} from "../store/selectors";

export const useProjectDataSyncBridge = () => {
    const imageSets = useAppStore(selectImageSets);
    const dimensionLines = useAppStore(selectDimensionLines);
    const unitFactor = useAppStore(selectUnitFactor);
    const unit = useAppStore(selectUnit);
    const projectDataChangeOrigin = useAppStore(selectProjectDataChangeOrigin);
    const interactionMode = useAppStore(selectInteractionMode);
    const selectedImageId = useAppStore(selectSelectedImageId);
    const selectedDimensionLineId = useAppStore(selectSelectedDimensionLineId);
    const ipcService = useIpcService();

    const bridgeRef = useRef<ProjectSyncBridge | null>(null);
    const previousIpcServiceRef = useRef(ipcService);

    useEffect(() => {
        const snapshot: ProjectSyncSnapshot = {
            imageSets,
            dimensionLines,
            unitFactor,
            unit,
            projectDataChangeOrigin,
            interactionMode,
            selectedImageId,
            selectedDimensionLineId,
        };

        if (
            !bridgeRef.current ||
            previousIpcServiceRef.current !== ipcService
        ) {
            bridgeRef.current = createProjectSyncBridge({
                initialSnapshot: snapshot,
                broadcaster: createSyncBroadcaster(ipcService),
            });
            previousIpcServiceRef.current = ipcService;
            return;
        }

        bridgeRef.current.sync(snapshot);
    }, [
        imageSets,
        dimensionLines,
        unitFactor,
        unit,
        projectDataChangeOrigin,
        interactionMode,
        selectedImageId,
        selectedDimensionLineId,
        ipcService,
    ]);
};
