import { RefObject, useCallback } from "react";
import Konva from "konva";
import { KonvaEventObject } from "konva/lib/Node";
import { setKonvaDragButtons } from "../utils/setKonvaDragButtons";

interface UseStagePointerHandlersParams {
    stageRef: RefObject<Konva.Stage | null>;
    isDimensionMode: boolean;
    setSelectedImageId: (id: string | null) => void;
    onMouseDownDimension: (
        e: KonvaEventObject<MouseEvent | TouchEvent>
    ) => void;
    onMouseMoveDimension: () => void;
    onMouseUpDimension: () => void;
    onUpdateStage: (newPos: { x: number; y: number; scale: number }) => void;
}

export const useStagePointerHandlers = ({
    stageRef,
    isDimensionMode,
    setSelectedImageId,
    onMouseDownDimension,
    onMouseMoveDimension,
    onMouseUpDimension,
    onUpdateStage,
}: UseStagePointerHandlersParams) => {
    const onDragEnd = useCallback(
        (e: KonvaEventObject<DragEvent>) => {
            if (e.target.getType() === "Stage") {
                const stage = e.target as Konva.Stage;
                onUpdateStage({
                    x: stage.x(),
                    y: stage.y(),
                    scale: stage.scaleX(),
                });
            }
        },
        [onUpdateStage]
    );

    const onMouseDown = useCallback(
        (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
            if (!isDimensionMode) {
                setKonvaDragButtons([1, 2]);
                if (stageRef.current) {
                    stageRef.current.draggable(true);
                }

                if (
                    "button" in e.evt &&
                    e.evt.button === 0 &&
                    e.target.getType() === "Stage"
                ) {
                    setSelectedImageId(null);
                }
            } else if ("button" in e.evt) {
                if (e.evt.button === 0) {
                    // 寸法線追加/編集は左ドラッグを使うため、ノードドラッグ可能な設定に戻す
                    setKonvaDragButtons([0]);
                    stageRef.current?.draggable(false);
                } else if (e.evt.button === 1 || e.evt.button === 2) {
                    setKonvaDragButtons([1, 2]);
                    if (stageRef.current) {
                        stageRef.current.draggable(true);
                    }
                }
            }

            onMouseDownDimension(e);
        },
        [isDimensionMode, onMouseDownDimension, setSelectedImageId, stageRef]
    );

    const onMouseMove = useCallback(() => {
        onMouseMoveDimension();
    }, [onMouseMoveDimension]);

    const onMouseUp = useCallback(() => {
        if (isDimensionMode) {
            // 右/中クリックパン後は左ドラッグ編集に即戻す
            setKonvaDragButtons([0]);
            stageRef.current?.draggable(false);
        }
        onMouseUpDimension();
    }, [isDimensionMode, onMouseUpDimension, stageRef]);

    return { onDragEnd, onMouseDown, onMouseMove, onMouseUp };
};
