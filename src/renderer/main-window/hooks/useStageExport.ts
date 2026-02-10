import { RefObject } from "react";
import Konva from "konva";

import { useIpcService } from "../../providers/IpcServiceProvider";

interface UseStageExportParams {
    stageRef: RefObject<Konva.Stage | null>;
    setUIHidden: (hidden: boolean) => void;
}

export const useStageExport = ({
    stageRef,
    setUIHidden,
}: UseStageExportParams) => {
    const ipcService = useIpcService();

    const handleExport = async (includeBackground: boolean) => {
        if (includeBackground) {
            setUIHidden(true);
            await new Promise((resolve) => setTimeout(resolve, 500));

            try {
                await ipcService.captureWindow();
            } finally {
                setUIHidden(false);
            }
            return;
        }

        const stage = stageRef.current;
        if (!stage) {
            return;
        }

        const dataUrl = stage.toDataURL({ pixelRatio: 2 });
        await ipcService.saveImage(dataUrl);
    };

    return { handleExport };
};
