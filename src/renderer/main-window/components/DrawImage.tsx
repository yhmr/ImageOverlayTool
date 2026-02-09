import React, { useEffect, useLayoutEffect, useRef } from "react";

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

    const onInitImageRef = useRef(onInitImage);

    useEffect(() => {
        onInitImageRef.current = onInitImage;
    }, [onInitImage]);

    // 画像読み込み後、未初期化のアンカーのみ初期化する
    useLayoutEffect(() => {
        if (
            image &&
            (!imageSet.init_anchor_pos || !imageSet.current_anchor_pos)
        ) {
            onInitImageRef.current(image);
        }
    }, [image, imageSet.init_anchor_pos, imageSet.current_anchor_pos]);

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
