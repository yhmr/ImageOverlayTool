import { useEffect, type RefObject } from "react";
import Konva from "konva";

import { SAVE_STAGE_DATA_URL_BRIDGE_KEY } from "../../../shared/constants/saveStageBridge";

type StageExportMimeType = "image/png" | "image/jpeg";

type StageExportBridgeWindow = Window & {
    [SAVE_STAGE_DATA_URL_BRIDGE_KEY]?: (
        mimeType?: StageExportMimeType
    ) => string | null;
};

export const useSaveStageBridge = (
    stageRef: RefObject<Konva.Stage | null>
): void => {
    useEffect(() => {
        const globalWindow = window as StageExportBridgeWindow;
        const bridgeSaveStageDataUrl = (
            mimeType?: StageExportMimeType
        ): string | null => {
            const stage = stageRef.current;
            if (!stage) {
                return null;
            }
            return stage.toDataURL({
                pixelRatio: 2,
                mimeType,
                quality: mimeType === "image/jpeg" ? 0.9 : undefined,
            });
        };

        globalWindow[SAVE_STAGE_DATA_URL_BRIDGE_KEY] = bridgeSaveStageDataUrl;

        return () => {
            delete globalWindow[SAVE_STAGE_DATA_URL_BRIDGE_KEY];
        };
    }, [stageRef]);
};
