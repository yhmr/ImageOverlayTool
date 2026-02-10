import { useCallback } from "react";
import type { ImageSet } from "../../../shared/types/ImageSet";
import type { AnchorPos } from "../../../shared/types/AnchorPos";
import { getIPCService } from "../../services/ipcService";

interface UseImageInitializationParams {
    imageSets: ImageSet[];
    syncImageSets: (imageSets: ImageSet[]) => void;
    updateImageSet: (payload: {
        index?: number;
        id?: string;
        imageSet: ImageSet;
    }) => void;
}

const createInitialAnchors = (width: number, height: number): AnchorPos => ({
    lt: { x: 0, y: 0 },
    lb: { x: 0, y: height },
    rt: { x: width, y: 0 },
    rb: { x: width, y: height },
});

export const useImageInitialization = ({
    imageSets,
    syncImageSets,
    updateImageSet,
}: UseImageInitializationParams) => {
    const onInitImage = useCallback(
        (imageSet: ImageSet, index: number) => {
            return (image: HTMLImageElement) => {
                const current = imageSets[index];
                if (!current || current.id !== imageSet.id) {
                    return;
                }

                const anchors = createInitialAnchors(image.width, image.height);
                const newImageSet = {
                    ...current,
                    initAnchorPos: anchors,
                    currentAnchorPos: anchors,
                };

                const nextImageSets = [...imageSets];
                nextImageSets[index] = newImageSet;

                // 画像ロード時の正規化更新は履歴に積まない
                syncImageSets(nextImageSets);
                void getIPCService().updateImageSets(nextImageSets);
            };
        },
        [imageSets, syncImageSets]
    );

    const onUpdateAnchor = useCallback(
        (imageSet: ImageSet, index: number) => {
            return (anchor: AnchorPos) => {
                const newImageSet = { ...imageSet, currentAnchorPos: anchor };
                updateImageSet({ index, imageSet: newImageSet });
            };
        },
        [updateImageSet]
    );

    return { onInitImage, onUpdateAnchor };
};
