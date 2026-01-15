import { useState, useCallback, useEffect } from "react";
import { useImageSetsStore } from "../store/useImageSetsStore";

export const useImageSelection = () => {
  const { imageSets } = useImageSetsStore();
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);

  // 選択された画像が削除された場合、選択を解除する
  useEffect(() => {
    if (
      selectedImageId &&
      !imageSets.find((imageSet) => imageSet.id === selectedImageId)
    ) {
      setSelectedImageId(null);
    }
  }, [imageSets, selectedImageId]);

  // DrawImageコンポーネントのonSelectハンドラを生成するヘルパー
  const getOnSelectHandler = useCallback(
    (id: string, isDimensionMode: boolean, onDeselectDimension: () => void) => {
      return () => {
        if (!isDimensionMode) {
          // dimensionモードでは画像選択を無視
          setSelectedImageId(id);
          onDeselectDimension();
        }
      };
    },
    []
  );

  return {
    selectedImageId,
    setSelectedImageId,
    getOnSelectHandler,
  };
};
