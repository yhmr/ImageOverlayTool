import React, { useLayoutEffect } from "react";

import useImage from "use-image";

import { ImageSet } from "../../../shared/types/ImageSet";

import { PerspectiveImage } from "./PerspectiveImage";

interface DrawImageProps {
    imageSet: ImageSet;
    onInitImage: (image: HTMLImageElement) => void;
    onSelect: () => void;
}
export const DrawImage = (props: DrawImageProps) => {
    const { imageSet, onInitImage, onSelect } = props;

    // 画像
    const [image] = useImage(imageSet.path);

    // ImageSetの関連初期化
    useLayoutEffect(() => {
        // 画像読み込み完了時、初期imageSetなら
        if (
            image &&
            (!imageSet.init_anchor_pos || !imageSet.current_anchor_pos)
        ) {
            onInitImage(image);
        }
    });

    return (
        <>
            {image && image !== undefined && (
                <PerspectiveImage
                    image={image}
                    imageSet={imageSet}
                    onSelect={onSelect}
                />
            )}
        </>
    );
};
