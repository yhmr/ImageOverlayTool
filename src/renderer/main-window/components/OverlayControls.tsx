import React, { useRef, useCallback, useLayoutEffect } from "react";
import Konva from "konva";
import { Circle, Line } from "react-konva";
import type { ImageSet } from "../../types/ImageSet";
import type { AnchorPos } from "../../types/AnchorPos";
import { useImageAnchor } from "../../hooks/useImageAnchor";

interface OverlayControlsProps {
    imageSet: ImageSet;
    onUpdateAnchor: (anchorPos: AnchorPos) => void;
}

export const OverlayControls = ({
    imageSet,
    onUpdateAnchor,
}: OverlayControlsProps) => {
    // アンカーとラインのRef
    const ltRef = useRef<Konva.Circle>(null);
    const lbRef = useRef<Konva.Circle>(null);
    const rtRef = useRef<Konva.Circle>(null);
    const rbRef = useRef<Konva.Circle>(null);
    const lineRef = useRef<Konva.Line>(null);

    // 配列化して扱いやすくする
    const cRefs = [ltRef, lbRef, rtRef, rbRef];

    const { onDragStart, onDragEnd, onCircleDragEnd } = useImageAnchor({
        imageSet,

        onUpdateAnchor,
    });

    // 選択時の処理（ドラッグ有効化など）
    const onMouseDown = useCallback(() => {
        // ドラッグボタンを上書きし、ドラッグ有効化
        Konva.dragButtons = [0];
        if (lineRef.current) lineRef.current.draggable(true);
        if (ltRef.current) ltRef.current.draggable(true);
        if (lbRef.current) lbRef.current.draggable(true);
        if (rtRef.current) rtRef.current.draggable(true);
        if (rbRef.current) rbRef.current.draggable(true);
    }, []);

    const circleDragHandler = onCircleDragEnd(ltRef, lbRef, rtRef, rbRef);

    // アンカー位置の同期
    useLayoutEffect(() => {
        if (imageSet.current_anchor_pos) {
            if (
                ltRef.current &&
                lbRef.current &&
                rtRef.current &&
                rbRef.current
            ) {
                const apply = (ref: Konva.Circle, pos: { x: number; y: number }) => {
                    ref.x(pos.x);
                    ref.y(pos.y);
                };
                apply(ltRef.current, imageSet.current_anchor_pos.lt);
                apply(lbRef.current, imageSet.current_anchor_pos.lb);
                apply(rtRef.current, imageSet.current_anchor_pos.rt);
                apply(rbRef.current, imageSet.current_anchor_pos.rb);
            }
            if (lineRef.current) {
                // ラインの頂点を更新
                lineRef.current.points([
                    imageSet.current_anchor_pos.lt.x,
                    imageSet.current_anchor_pos.lt.y,
                    imageSet.current_anchor_pos.lb.x,
                    imageSet.current_anchor_pos.lb.y,
                    imageSet.current_anchor_pos.rb.x,
                    imageSet.current_anchor_pos.rb.y,
                    imageSet.current_anchor_pos.rt.x,
                    imageSet.current_anchor_pos.rt.y,
                    imageSet.current_anchor_pos.lt.x,
                    imageSet.current_anchor_pos.lt.y,
                ]);
                // 内部変換をリセット
                lineRef.current.scaleX(1);
                lineRef.current.scaleY(1);
                lineRef.current.x(0);
                lineRef.current.y(0);
            }
        }
    }, [imageSet]);

    return (
        <>
            <Line
                ref={lineRef}
                closed={true}
                stroke={"#4e4eff"}
                strokeWidth={3}
                onMouseDown={onMouseDown}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
            />
            {cRefs.map((ref, index) => (
                <Circle
                    key={index}
                    draggable={false} // onMouseDownでtrueにする
                    onMouseDown={onMouseDown}
                    onDragEnd={circleDragHandler}
                    ref={ref}
                    radius={15}
                    stroke="#1919eb"
                    fill="#4e4eff"
                />
            ))}
        </>
    );
};
