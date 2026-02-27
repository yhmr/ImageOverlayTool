import { useCallback } from "react";

import i18n from "../../../i18n/configs";
import { useIpcService } from "../../providers/IpcServiceProvider";
import { applyLaunchIntent } from "../services/sceneFileApplicator";

const SCENE_FILE_SUFFIX = ".scene.json";

export const isSceneFilePath = (filePath: string): boolean =>
    filePath.toLowerCase().endsWith(SCENE_FILE_SUFFIX);

const toErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
};

export const useSceneFileLoader = () => {
    const ipcService = useIpcService();

    return useCallback(
        async (filePath: string): Promise<void> => {
            try {
                const launchIntent = await ipcService.loadSceneFromPath(
                    filePath
                );
                applyLaunchIntent(launchIntent);
            } catch (error) {
                const message = toErrorMessage(error);
                void ipcService.log.error("Scene file load failed", {
                    filePath,
                    message,
                });
                window.alert(
                    i18n.t("render.scene_load.failed", {
                        message,
                    })
                );
            }
        },
        [ipcService]
    );
};
