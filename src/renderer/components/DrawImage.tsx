import React, { useLayoutEffect } from "react";

import useImage from "use-image";

import { ImageSet } from "../types/ImageSet";
import { AnchorPos } from "../types/AnchorPos";

import { PerspectiveImage } from "./PerspectiveImage";
import { OverlayControls } from "./OverlayControls";

interface DrawImageProps {
  imageSet: ImageSet;
  onInitImage: (image: HTMLImageElement) => void;
  onUpdateAnchor: (anchorPos: AnchorPos) => void;
  isSelected: boolean;
  onSelect: () => void;
}
export const DrawImage = (props: DrawImageProps) => {
  const { imageSet, onInitImage, onUpdateAnchor, isSelected, onSelect } = props;

  // 画像
  const [image] = useImage(imageSet.path);

  // ImageSetの関連初期化
  useLayoutEffect(() => {
    // 画像読み込み完了時、初期imageSetなら
    if (image && (!imageSet.init_anchor_pos || !imageSet.current_anchor_pos)) {
      onInitImage(image);
    }
  });

  return (
    <>
      {image && image !== undefined && (
        <>
          <PerspectiveImage image={image} imageSet={imageSet} />
          <OverlayControls
            imageSet={imageSet}
            isSelected={isSelected}
            onUpdateAnchor={onUpdateAnchor}
            onSelect={onSelect}
          />
        </>
      )}
    </>
  );
};
