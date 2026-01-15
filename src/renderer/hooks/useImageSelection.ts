import { useState, useCallback, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";

export const useImageSelection = () => {
  const { imageSets } = useSelector((state: RootState) => state.imageSets);
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
