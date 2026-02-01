import { useAppStore } from "../store/useAppStore";
import UUID from "uuidjs";
import { ImageSet } from "@/shared/types/ImageSet";
import { getIPCService } from "../services/ipcService";
import { TITLE_BAR_HEIGHT } from "../constants";

export function useCapture() {
    const { imageSets, setImageSets, canvas } = useAppStore();

    const handleCapture = async () => {
        const ipcService = getIPCService();
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

                const newSet: ImageSet = {
                    id: UUID.generate(),
                    path: `local-file://${filePath.replace(/\\/g, "/")}`,
                    transparency: 0,
                    rotation: 0,
                    init_anchor_pos: anchorPos,
                    current_anchor_pos: anchorPos,
                };

                // 一番後ろ（配列の先頭）に追加
                const newImageSets = [...imageSets];
                if (newImageSets.length === 1 && !newImageSets[0].path) {
                    newImageSets[0] = newSet;
                } else {
                    newImageSets.unshift(newSet);
                }
                setImageSets(newImageSets);

                ipcService.log.info("Background captured and added.");
            }
        } catch (error) {
            console.error("Capture failed:", error);
        }
    };

    return { handleCapture };
}
