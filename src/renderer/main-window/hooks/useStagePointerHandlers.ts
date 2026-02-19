import { RefObject, useCallback, useRef } from "react";
import Konva from "konva";
import { KonvaEventObject } from "konva/lib/Node";
import { setKonvaDragButtons } from "../utils/setKonvaDragButtons";
import {
    resolvePointerButton,
    resolvePointerPolicy,
    resolveSessionOnMouseDown,
    type PointerSession,
} from "./pointerSessionMachine";
import type { InteractionMode } from "../../../shared/types/InteractionMode";

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
    const interactionMode: InteractionMode = isDimensionMode
        ? "dimension_select"
        : "default";
    const pointerSessionRef = useRef<PointerSession>("idle");

    const applyPointerPolicy = useCallback(
        (session: PointerSession) => {
            // 状態機械の出力をもとに、Konvaのドラッグボタン設定とStageのdraggableを切り替える。
            const policy = resolvePointerPolicy(interactionMode, session);
            setKonvaDragButtons(policy.dragButtons);
            stageRef.current?.draggable(policy.stageDraggable);
        },
        [interactionMode, stageRef]
    );

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
            const pointerButton = resolvePointerButton(e.evt);
            const nextSession = resolveSessionOnMouseDown(
                interactionMode,
                pointerButton
            );
            pointerSessionRef.current = nextSession;
            applyPointerPolicy(nextSession);

            if (!isDimensionMode) {
                if (pointerButton === 0 && e.target.getType() === "Stage") {
                    setSelectedImageId(null);
                }
            }

            onMouseDownDimension(e);
        },
        [
            applyPointerPolicy,
            interactionMode,
            isDimensionMode,
            onMouseDownDimension,
            setSelectedImageId,
        ]
    );

    const onMouseMove = useCallback(() => {
        onMouseMoveDimension();
    }, [onMouseMoveDimension]);

    const onMouseUp = useCallback(() => {
        pointerSessionRef.current = "idle";
        applyPointerPolicy("idle");
        onMouseUpDimension();
    }, [applyPointerPolicy, onMouseUpDimension]);

    return { onDragEnd, onMouseDown, onMouseMove, onMouseUp };
};
