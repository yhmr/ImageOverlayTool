import { useState, useCallback } from "react";
import Konva from "konva";
import { ImageSet } from "../../shared/types/ImageSet";
import { Point } from "../../shared/types/Point";
import { AnchorPos } from "../../shared/types/AnchorPos";
import { calculateMovedAnchors, rotateAnchorPos } from "../utils/anchorUtils";

interface UseImageAnchorProps {
    imageSet: ImageSet;
    onUpdateAnchor: (anchorPos: AnchorPos) => void;
}

export const useImageAnchor = ({
    imageSet,
    onUpdateAnchor,
}: UseImageAnchorProps) => {
    const [dragStartPos, setDragStartPos] = useState<Point>({ x: 0, y: 0 });

    const onDragStart = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
        setDragStartPos({ x: e.target.x(), y: e.target.y() });
    }, []);

    const onDragEnd = useCallback(
        (e: Konva.KonvaEventObject<DragEvent>) => {
            if (imageSet.current_anchor_pos) {
                // 移動距離を計算
                const diff = {
                    x: e.target.x() - dragStartPos.x,
                    y: e.target.y() - dragStartPos.y,
                };
                // 回転を考慮した現在のアンカー位置を取得 (Wrapperが回転された座標を期待しているため)
                const currentAnchors = imageSet.rotation
                    ? rotateAnchorPos(
                          imageSet.current_anchor_pos,
                          imageSet.rotation
                      )
                    : imageSet.current_anchor_pos;

                // 新しいアンカー位置を計算
                const newAnchor = calculateMovedAnchors(currentAnchors, diff);
                onUpdateAnchor(newAnchor);

                e.target.x(0);
                e.target.y(0);
            }
        },
        [imageSet, dragStartPos, onUpdateAnchor]
    );

    const onCircleDragEnd = useCallback(
        (
            ltRef: React.RefObject<Konva.Circle>,
            lbRef: React.RefObject<Konva.Circle>,
            rtRef: React.RefObject<Konva.Circle>,
            rbRef: React.RefObject<Konva.Circle>
        ) => {
            return () => {
                // ドラッグされた対象の座標は更新済み
                if (
                    ltRef.current &&
                    lbRef.current &&
                    rtRef.current &&
                    rbRef.current
                ) {
                    const newAnchor = {
                        lt: {
                            x: ltRef.current.x(),
                            y: ltRef.current.y(),
                        },
                        lb: {
                            x: lbRef.current.x(),
                            y: lbRef.current.y(),
                        },
                        rt: {
                            x: rtRef.current.x(),
                            y: rtRef.current.y(),
                        },
                        rb: {
                            x: rbRef.current.x(),
                            y: rbRef.current.y(),
                        },
                    };
                    onUpdateAnchor(newAnchor);
                }
            };
        },
        [onUpdateAnchor]
    );

    return { onDragStart, onDragEnd, onCircleDragEnd };
};
