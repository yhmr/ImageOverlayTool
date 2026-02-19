import { TITLE_BAR_HEIGHT } from "../constants";
import { createImageSetFromLocalFile } from "../factories/imageSetFactory";
import { useIpcService } from "../providers/IpcServiceProvider";
import { useAppStore } from "../store/useAppStore";

export function useCapture() {
    const { imageSets, setImageSets, canvas } = useAppStore();
    const ipcService = useIpcService();

    const captureBackground = async () => {
        try {
            const result = await ipcService.captureScreen();
            if (result) {
                const { filePath, width, height } = result;

                // Canvasの逆変換（MenuBarの高さを考慮して上にずらす）
                const offsetY = TITLE_BAR_HEIGHT / canvas.scale;

                const lt = {
                    x: -canvas.x / canvas.scale,
                    y: -canvas.y / canvas.scale - offsetY,
                };
                const rt = {
                    x: (width - canvas.x) / canvas.scale,
                    y: -canvas.y / canvas.scale - offsetY,
                };
                const lb = {
                    x: -canvas.x / canvas.scale,
                    y: (height - canvas.y) / canvas.scale - offsetY,
                };
                const rb = {
                    x: (width - canvas.x) / canvas.scale,
                    y: (height - canvas.y) / canvas.scale - offsetY,
                };

                const anchorPos = { lt, rt, lb, rb };

                const newImageSet = createImageSetFromLocalFile(filePath, {
                    initAnchorPos: anchorPos,
                    currentAnchorPos: anchorPos,
                });

                // 一番後ろ（配列の先頭）に追加
                const newImageSets = [...imageSets];
                if (newImageSets.length === 1 && !newImageSets[0].path) {
                    newImageSets[0] = newImageSet;
                } else {
                    newImageSets.unshift(newImageSet);
                }
                setImageSets(newImageSets);

                ipcService.log.info("Background captured and added.");
            }
        } catch (error) {
            try {
                void ipcService.log.error("Capture failed", { error });
            } catch {
                // noop
            }
        }
    };

    return { captureBackground };
}
