"use no memo";
import React, { useEffect, useMemo, useState } from "react";
import { Image as KonvaImage } from "react-konva";
import Perspective from "perspectivets";
import { KonvaEventObject } from "konva/lib/Node";
import { Context } from "konva/lib/Context";
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
    const [pos, setPos] = useState({
        x: 0,
        y: 0,
        offsetX: 0,
        offsetY: 0,
        left: 0,
        top: 0,
    });

    useEffect(() => {
        if (image && imageSet.currentAnchorPos) {
            // Homography処理
            const { left, top, right, bottom } = getBoundingBox(
                imageSet.currentAnchorPos
            );
            const center = getCenter(imageSet.currentAnchorPos);

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
                left,
                top,
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
                    topLeftX: imageSet.currentAnchorPos.lt.x - left,
                    topLeftY: imageSet.currentAnchorPos.lt.y - top,
                    topRightX: imageSet.currentAnchorPos.rt.x - left,
                    topRightY: imageSet.currentAnchorPos.rt.y - top,
                    bottomRightX: imageSet.currentAnchorPos.rb.x - left,
                    bottomRightY: imageSet.currentAnchorPos.rb.y - top,
                    bottomLeftX: imageSet.currentAnchorPos.lb.x - left,
                    bottomLeftY: imageSet.currentAnchorPos.lb.y - top,
                });

                // Konva.Imageに更新を通知
                setRenderTrigger((prev) => prev + 1);
            }
        }
    }, [image, imageSet, canvas]);

    // クリックハンドラ
    const onImageClick = (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
        if (onSelect) {
            onSelect();
            e.cancelBubble = true; // Stop bubbling to stage
        }
    };

    const onImageMouseDown = (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
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
            onClick={onImageClick}
            onTap={onImageClick}
            onMouseDown={onImageMouseDown}
            listening={true} // Ensure it catches events
            // カスタムヒットファンクション：四角形の内側だけをヒットにする
            hitFunc={(ctx: Context, shape) => {
                if (!imageSet.currentAnchorPos) {
                    ctx.fillStrokeShape(shape);
                    return;
                }
                const { currentAnchorPos } = imageSet;
                const { left, top } = pos;

                ctx.beginPath();
                ctx.moveTo(
                    currentAnchorPos.lt.x - left,
                    currentAnchorPos.lt.y - top
                );
                ctx.lineTo(
                    currentAnchorPos.rt.x - left,
                    currentAnchorPos.rt.y - top
                );
                ctx.lineTo(
                    currentAnchorPos.rb.x - left,
                    currentAnchorPos.rb.y - top
                );
                ctx.lineTo(
                    currentAnchorPos.lb.x - left,
                    currentAnchorPos.lb.y - top
                );
                ctx.closePath();
                // Konvaのヒット検出用に形状を描画
                ctx.fillStrokeShape(shape);
            }}
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
