import { useEffect, useRef } from "react";

import { useIpcService } from "../providers/IpcServiceProvider";
import { useAppStore } from "../store/useAppStore";

/**
 * ローカル変更時のみ、プロジェクトデータをIPC経由で他ウィンドウへ同期する。
 */
export const useProjectDataSyncBridge = () => {
    const { imageSets, unitFactor, unit, projectDataChangeOrigin } =
        useAppStore();
    const ipcService = useIpcService();

    const isInitializedRef = useRef(false);
    const prevRef = useRef({ imageSets, unitFactor, unit });

    useEffect(() => {
        if (!isInitializedRef.current) {
            isInitializedRef.current = true;
            prevRef.current = { imageSets, unitFactor, unit };
            return;
        }

        const prev = prevRef.current;

        if (projectDataChangeOrigin === "local") {
            if (prev.imageSets !== imageSets) {
                void ipcService.updateImageSets(imageSets);
            }
            if (prev.unitFactor !== unitFactor) {
                void ipcService.updateUnitFactor(unitFactor);
            }
            if (prev.unit !== unit) {
                void ipcService.updateUnit(unit);
            }
        }

        prevRef.current = { imageSets, unitFactor, unit };
    }, [imageSets, unitFactor, unit, projectDataChangeOrigin, ipcService]);
};
