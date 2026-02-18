import { useEffect, useRef } from "react";

import { useIpcService } from "../providers/IpcServiceProvider";
import { useAppStore } from "../store/useAppStore";

/**
 * ローカル変更時のみ、プロジェクトデータをIPC経由で他ウィンドウへ同期する。
 */
export const useProjectDataSyncBridge = () => {
    const {
        imageSets,
        dimensionLines,
        unitFactor,
        unit,
        projectDataChangeOrigin,
        selectedImageId,
    } = useAppStore();
    const ipcService = useIpcService();

    const isInitializedRef = useRef(false);
    const prevRef = useRef({ imageSets, dimensionLines, unitFactor, unit });

    useEffect(() => {
        if (!isInitializedRef.current) {
            isInitializedRef.current = true;
            prevRef.current = { imageSets, dimensionLines, unitFactor, unit };
            return;
        }

        const prev = prevRef.current;

        if (projectDataChangeOrigin === "local") {
            if (prev.imageSets !== imageSets) {
                void ipcService.updateImageSets(imageSets);
            }
            if (prev.dimensionLines !== dimensionLines) {
                void ipcService.updateDimensionLines(dimensionLines);
            }
            if (prev.unitFactor !== unitFactor) {
                void ipcService.updateUnitFactor(unitFactor);
            }
            if (prev.unit !== unit) {
                void ipcService.updateUnit(unit);
            }
        }

        prevRef.current = { imageSets, dimensionLines, unitFactor, unit };
    }, [
        imageSets,
        dimensionLines,
        unitFactor,
        unit,
        projectDataChangeOrigin,
        ipcService,
    ]);

    // selectedImageIdの同期（undo対象外なので別のeffectで管理）
    const prevSelectedImageIdRef = useRef(selectedImageId);
    useEffect(() => {
        if (prevSelectedImageIdRef.current !== selectedImageId) {
            void ipcService.updateSelectedImageId(selectedImageId);
            prevSelectedImageIdRef.current = selectedImageId;
        }
    }, [selectedImageId, ipcService]);
};
