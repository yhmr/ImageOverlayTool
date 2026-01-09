import React, { useEffect, useState } from "react";
import { useCallbackRef } from "use-callback-ref";
import { Html } from "react-konva-utils";
import Perspective from "perspectivets";
import { ImageSet } from "../types/ImageSet";
import { getBoundingBox } from "../utils/anchorUtils";

interface PerspectiveImageProps {
    image: HTMLImageElement;
    imageSet: ImageSet;
}

export const PerspectiveImage = ({ image, imageSet }: PerspectiveImageProps) => {
    // useCallbackRefで再描画を強制する
    const [, forceUpdate] = useState(false);
    const canvasRef = useCallbackRef<HTMLCanvasElement>(null, () =>
        forceUpdate((state) => !state)
    );

    useEffect(() => {
        if (image && imageSet.current_anchor_pos && canvasRef.current) {
            // Homography処理
            const cnv = canvasRef.current;

            // Left/Topは左上固定
            cnv.style.position = "absolute";
            const { left, top, right, bottom } = getBoundingBox(
                imageSet.current_anchor_pos
            );

            cnv.width = right - left;
            cnv.height = bottom - top;
            cnv.style.left = `${left}px`;
            cnv.style.top = `${top}px`;
            cnv.style.zIndex = "0";
            cnv.style.pointerEvents = "none";

            const ctx = cnv.getContext("2d", { willReadFrequently: true });
            if (ctx) {
                // クリア
                ctx.clearRect(0, 0, cnv.width, cnv.height);
                // 透過率
                ctx.globalAlpha = 1.0 - imageSet.transparency;
                // 変形後の図形を記述
                const p = new Perspective(ctx, image);
                p.draw({
                    topLeftX: imageSet.current_anchor_pos.lt.x - left,
                    topLeftY: imageSet.current_anchor_pos.lt.y - top,
                    topRightX: imageSet.current_anchor_pos.rt.x - left,
                    topRightY: imageSet.current_anchor_pos.rt.y - top,
                    bottomRightX: imageSet.current_anchor_pos.rb.x - left,
                    bottomRightY: imageSet.current_anchor_pos.rb.y - top,
                    bottomLeftX: imageSet.current_anchor_pos.lb.x - left,
                    bottomLeftY: imageSet.current_anchor_pos.lb.y - top,
                });
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [image, imageSet, canvasRef.current]);

    return (
        <Html divProps={{ style: { pointerEvents: "none" } }}>
            <canvas ref={canvasRef} />
        </Html>
    );
};
