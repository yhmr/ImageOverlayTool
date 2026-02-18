import { useCallback, RefObject, useState } from "react";
import Konva from "konva";
import { KonvaEventObject } from "konva/lib/Node";
import { useAppStore } from "../store/useAppStore";
import { DimensionLine } from "../../shared/types/DimensionLine";
import { MIN_DIMENSION_LINE_DISTANCE } from "../constants";
import { useDimensionKeyboard } from "./useDimensionKeyboard";
import { DIMENSION_LINE_COLOR_DEFAULT } from "../../shared/constants/dimensionLine";

export const useDimensionLineMode = (
    stageRef: RefObject<Konva.Stage | null>
) => {
    const {
        dimensionLines,
        unitFactor,
        unit,
        addDimensionLine,
        updateDimensionLine,
        removeDimensionLine,
        interactionMode,
        setInteractionMode,
        selectedDimensionLineId,
        setSelectedDimensionLineId,
    } = useAppStore();

    const [drawingLineId, setDrawingLineId] = useState<string | null>(null);

    const isDimensionMode = interactionMode === "dimension";

    const setDimensionModeEnabled = useCallback(
        (enabled: boolean) => {
            setInteractionMode(enabled ? "dimension" : "default");
        },
        [setInteractionMode]
    );

    const getStagePointerPos = useCallback(() => {
        const stage = stageRef.current;
        if (!stage) return null;
        const pos = stage.getPointerPosition();
        if (!pos) return null;
        const transform = stage.getAbsoluteTransform().copy();
        transform.invert();
        return transform.point(pos);
    }, [stageRef]);

    const onStageMouseDown = useCallback(
        (_e: KonvaEventObject<MouseEvent | TouchEvent>) => {
            if (!isDimensionMode) return;
            if ("button" in _e.evt && _e.evt.button === 0) {
                const pos = getStagePointerPos();
                if (pos) {
                    const id = crypto.randomUUID();
                    const newLine: DimensionLine = {
                        id,
                        start: pos,
                        end: pos,
                        color: DIMENSION_LINE_COLOR_DEFAULT,
                    };
                    addDimensionLine(newLine);
                    setDrawingLineId(id);
                    setSelectedDimensionLineId(id);
                }
            }
        },
        [
            isDimensionMode,
            getStagePointerPos,
            addDimensionLine,
            setSelectedDimensionLineId,
        ]
    );

    const onStageMouseMove = useCallback(() => {
        if (drawingLineId) {
            const pos = getStagePointerPos();
            if (pos && dimensionLines) {
                const line = dimensionLines.find((l) => l.id === drawingLineId);
                if (line) {
                    updateDimensionLine({ ...line, end: pos });
                }
            }
        }
    }, [
        drawingLineId,
        getStagePointerPos,
        dimensionLines,
        updateDimensionLine,
    ]);

    const onMouseUp = useCallback(() => {
        if (drawingLineId) {
            if (dimensionLines) {
                const line = dimensionLines.find((l) => l.id === drawingLineId);
                if (line) {
                    const dx = line.end.x - line.start.x;
                    const dy = line.end.y - line.start.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < MIN_DIMENSION_LINE_DISTANCE) {
                        removeDimensionLine(drawingLineId);
                        setSelectedDimensionLineId(null);
                    }
                }
            }
            setDrawingLineId(null);
        }
    }, [
        drawingLineId,
        dimensionLines,
        removeDimensionLine,
        setSelectedDimensionLineId,
    ]);

    // キーボードイベント処理は専用フックに委譲
    useDimensionKeyboard();

    return {
        isDimensionMode,
        setDimensionModeEnabled,
        selectedDimensionLineId,
        setSelectedDimensionLineId,
        dimensionLines,
        unitFactor,
        unit,
        updateDimensionLine,
        onMouseDown: onStageMouseDown,
        onMouseMove: onStageMouseMove,
        onMouseUp,
    };
};
