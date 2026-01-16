"use no memo";
import React, { useEffect, useMemo, useState } from "react";
import { Image as KonvaImage } from "react-konva";
import Perspective from "perspectivets";
import { KonvaEventObject } from "konva/lib/Node";
import type { ImageSet } from "../../../shared/types/ImageSet";
import { getBoundingBox, getCenter } from "../../utils/anchorUtils";

interface PerspectiveImageProps {
    image: HTMLImageElement;
    imageSet: ImageSet;
    onSelect?: () => void;
}

export const PerspectiveImage = ({
    image,
    imageSet,
    onSelect,
}: PerspectiveImageProps) => {
    // オフスクリーンCanvas
    const canvas = useMemo(() => document.createElement("canvas"), []);
    const [renderTrigger, setRenderTrigger] = useState(0); // 再描画用

    // 描画位置情報の保持
    const [pos, setPos] = useState({ x: 0, y: 0, offsetX: 0, offsetY: 0 });

    useEffect(() => {
        if (image && imageSet.current_anchor_pos) {
            // Homography処理
            const { left, top, right, bottom } = getBoundingBox(
                imageSet.current_anchor_pos
            );
            const center = getCenter(imageSet.current_anchor_pos);

            // Canvasサイズなどを更新
            if (
                canvas.width !== right - left ||
                canvas.height !== bottom - top
            ) {
                canvas.width = right - left;
                canvas.height = bottom - top;
            }

            // 画像の配置位置：回転の中心（重心）に配置し、そこからOffsetでCanvas内の描画位置を合わせる
            setPos({
                x: center.x,
                y: center.y,
                offsetX: center.x - left,
                offsetY: center.y - top,
            });

            const ctx = canvas.getContext("2d");
            if (ctx) {
                // クリア
                ctx.clearRect(0, 0, canvas.width, canvas.height);
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

                // Konva.Imageに更新を通知
                setRenderTrigger((prev) => prev + 1);
            }
        }
    }, [image, imageSet, canvas]);

    // クリックハンドラ
    const handleClick = (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
        if (onSelect) {
            onSelect();
            e.cancelBubble = true; // Stop bubbling to stage
        }
    };

    const handleMouseDown = (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
        // 左クリックの場合はバブリングを止める（ステージのドラッグなどと干渉しないように）
        if ("button" in e.evt && e.evt.button === 0) {
            e.cancelBubble = true;
        }
    };

    return (
        <KonvaImage
            image={canvas}
            x={pos.x}
            y={pos.y}
            rotation={imageSet.rotation || 0}
            offsetX={pos.offsetX}
            offsetY={pos.offsetY}
            onClick={handleClick}
            onTap={handleClick}
            onMouseDown={handleMouseDown}
            listening={true} // Ensure it catches events
            // Konva.Imageはデフォルトでlistening=true
            // キャッシュを無効化して常に最新のcanvasを表示するためにkeyを変えるか、
            // imageオブジェクト自体は変わらないので、Konvaが内部でredrawしてくれることを期待
            // 明示的にimage={canvas}を渡しているのでcanvasの中身が変われば描画時に反映されるはずだが、
            // KonvaはHTMLCanvasElementの変更を自動検知しない場合があるため、
            // ステート更新で再レンダリングを促す
            key={renderTrigger}
        />
    );
};
