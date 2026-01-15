import { useCallback, useEffect } from "react";
import { useAppStore } from "../store/useAppStore";

export const useImageSelection = () => {
    const { imageSets, selectedImageId, selectImage, interactionMode } =
        useAppStore();

    // 選択された画像が削除された場合、選択を解除する
    useEffect(() => {
        if (selectedImageId) {
            const found = imageSets.find(
                (imageSet) => imageSet.id === selectedImageId
            );
            if (!found) {
                selectImage(null);
            }
        }
    }, [imageSets, selectedImageId, selectImage]);

    // DrawImageコンポーネントのonSelectハンドラを生成するヘルパー
    const getOnSelectHandler = useCallback(
        (id: string) => {
            return () => {
                if (interactionMode !== "dimension") {
                    selectImage(id);
                }
            };
        },
        [interactionMode, selectImage]
    );

    return {
        selectedImageId,
        setSelectedImageId: selectImage, // 互換性のためエイリアス
        getOnSelectHandler,
    };
};
