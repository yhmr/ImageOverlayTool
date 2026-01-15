import React, { useRef, useCallback, useLayoutEffect } from "react";
import Konva from "konva";
import { Circle, Line } from "react-konva";
import type { ImageSet } from "../../../shared/types/ImageSet";
import type { AnchorPos } from "../../../shared/types/AnchorPos";
import { useImageAnchor } from "../../hooks/useImageAnchor";
import { rotateAnchorPos } from "../../utils/anchorUtils";
import {
    ANCHOR_RADIUS,
    ANCHOR_STROKE_COLOR,
    ANCHOR_FILL_COLOR,
    OVERLAY_STROKE_COLOR,
    OVERLAY_STROKE_WIDTH,
} from "../../constants";

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

    // ドラッグ時の座標補正を行うラッパー
    const onUpdateAnchorWrapper = useCallback(
        (newAnchors: AnchorPos) => {
            // useImageAnchorは「コールバックで新しいアンカーセット全体」を返してくる。
            // 計算結果は回転後の座標系に基づいている可能性があるため、必要に応じて逆回転させて元の座標系に戻す。

            if (imageSet.rotation) {
                const corrected = rotateAnchorPos(
                    newAnchors,
                    -imageSet.rotation
                );
                onUpdateAnchor(corrected);
            } else {
                onUpdateAnchor(newAnchors);
            }
        },
        [imageSet.rotation, onUpdateAnchor]
    );

    const { onDragStart, onDragEnd, onCircleDragEnd } = useImageAnchor({
        imageSet,
        onUpdateAnchor: onUpdateAnchorWrapper,
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
            // 表示用に回転させたアンカーを計算
            const displayedAnchors = imageSet.rotation
                ? rotateAnchorPos(
                      imageSet.current_anchor_pos,
                      imageSet.rotation
                  )
                : imageSet.current_anchor_pos;

            if (
                ltRef.current &&
                lbRef.current &&
                rtRef.current &&
                rbRef.current
            ) {
                const apply = (
                    ref: Konva.Circle,
                    pos: { x: number; y: number }
                ) => {
                    ref.x(pos.x);
                    ref.y(pos.y);
                };
                apply(ltRef.current, displayedAnchors.lt);
                apply(lbRef.current, displayedAnchors.lb);
                apply(rtRef.current, displayedAnchors.rt);
                apply(rbRef.current, displayedAnchors.rb);
            }
            if (lineRef.current) {
                // ラインの頂点を更新
                lineRef.current.points([
                    displayedAnchors.lt.x,
                    displayedAnchors.lt.y,
                    displayedAnchors.lb.x,
                    displayedAnchors.lb.y,
                    displayedAnchors.rb.x,
                    displayedAnchors.rb.y,
                    displayedAnchors.rt.x,
                    displayedAnchors.rt.y,
                    displayedAnchors.lt.x,
                    displayedAnchors.lt.y,
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
                stroke={OVERLAY_STROKE_COLOR}
                strokeWidth={OVERLAY_STROKE_WIDTH}
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
                    radius={ANCHOR_RADIUS}
                    stroke={ANCHOR_STROKE_COLOR}
                    fill={ANCHOR_FILL_COLOR}
                />
            ))}
        </>
    );
};
