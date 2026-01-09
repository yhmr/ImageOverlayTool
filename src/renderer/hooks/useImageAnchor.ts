import { useState, useCallback } from "react";
import Konva from "konva";
import { ImageSet } from "../types/ImageSet";
import { AnchorPos, Point } from "../types/AnchorPos";
import { calculateMovedAnchors } from "../utils/anchorUtils";

interface UseImageAnchorProps {
    imageSet: ImageSet;
    isSelected: boolean;
    onUpdateAnchor: (anchorPos: AnchorPos) => void;
}

export const useImageAnchor = ({
    imageSet,
    isSelected,
    onUpdateAnchor,
}: UseImageAnchorProps) => {
    const [dragStartPos, setDragStartPos] = useState<Point>({ x: 0, y: 0 });

    const onDragStart = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
        setDragStartPos({ x: e.target.x(), y: e.target.y() });
    }, []);

    const onDragEnd = useCallback(
        (e: Konva.KonvaEventObject<DragEvent>) => {
            if (isSelected && imageSet.current_anchor_pos) {
                // 移動距離を計算
                const diff = {
                    x: e.target.x() - dragStartPos.x,
                    y: e.target.y() - dragStartPos.y,
                };
                // 新しいアンカー位置を計算
                const newAnchor = calculateMovedAnchors(
                    imageSet.current_anchor_pos,
                    diff
                );
                // 親でpropを更新
                onUpdateAnchor(newAnchor);

                // 位置リセット (座標系は親のLayer基準で、Line自体のposも変わるが、
                // DrawImage側でrender時にlineRef.current.x(0)しているので、
                // ここでもリセットしておくと安全かも。
                // ただし元のDrawImageではDragEndでline自体の位置を戻す記述はないが、
                // lineRef.current.points(...) で再描画しているので実質リセットされるはず)
                // ここでは newAnchor を返して、親コンポーネントが再描画することを期待する。
                e.target.x(0);
                e.target.y(0);
            }
        },
        [isSelected, imageSet, dragStartPos, onUpdateAnchor]
    );

    const onCircleDragEnd = useCallback(
        (
            ltRef: React.RefObject<Konva.Circle>,
            lbRef: React.RefObject<Konva.Circle>,
            rtRef: React.RefObject<Konva.Circle>,
            rbRef: React.RefObject<Konva.Circle>
        ) => {
            return (e: Konva.KonvaEventObject<DragEvent>) => {
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
