"use no memo";
import React from "react";
import { Image as KonvaImage } from "react-konva";
import { KonvaEventObject } from "konva/lib/Node";
import { Context } from "konva/lib/Context";
import type { ImageSet } from "../../../shared/types/ImageSet";
import { usePerspectiveCanvas } from "../hooks/usePerspectiveCanvas";

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
    const { canvas, pos, renderTrigger } = usePerspectiveCanvas({
        image,
        imageSet,
    });

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
