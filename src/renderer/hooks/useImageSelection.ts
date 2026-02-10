import { useCallback, useEffect } from "react";
import { useAppStore } from "../store/useAppStore";

export const useImageSelection = () => {
    const { imageSets, selectedImageId, setSelectedImageId, interactionMode } =
        useAppStore();

    // 選択された画像が削除された場合、選択を解除する
    useEffect(() => {
        if (selectedImageId) {
            const found = imageSets.find(
                (imageSet) => imageSet.id === selectedImageId
            );
            if (!found) {
                setSelectedImageId(null);
            }
        }
    }, [imageSets, selectedImageId, setSelectedImageId]);

    // DrawImageコンポーネントのonSelectハンドラを生成するヘルパー
    const createImageSelectHandler = useCallback(
        (id: string) => {
            return () => {
                if (interactionMode !== "dimension") {
                    setSelectedImageId(id);
                }
            };
        },
        [interactionMode, setSelectedImageId]
    );

    return {
        selectedImageId,
        setSelectedImageId,
        createImageSelectHandler,
    };
};
