import { useCallback, RefObject, useMemo, useState } from "react";
import Konva from "konva";
import { KonvaEventObject } from "konva/lib/Node";
import { useAppStore } from "../store/useAppStore";
import { DimensionLine } from "../../shared/types/DimensionLine";
import { MIN_DIMENSION_LINE_DISTANCE } from "../constants";
import { useDimensionKeyboard } from "./useDimensionKeyboard";
import { DIMENSION_LINE_COLOR_DEFAULT } from "../../shared/constants/dimensionLine";
import { isDimensionInteractionMode } from "../../shared/types/InteractionMode";

export const useDimensionLineMode = (
    stageRef: RefObject<Konva.Stage | null>
) => {
    const {
        dimensionLines,
        unitFactor,
        unit,
        addDimensionLine,
        updateDimensionLine,
        interactionMode,
        setInteractionMode,
        selectedDimensionLineId,
        setSelectedDimensionLineId,
    } = useAppStore();

    const [draftLine, setDraftLine] = useState<DimensionLine | null>(null);

    const isDimensionMode = isDimensionInteractionMode(interactionMode);
    const isDimensionAddMode = interactionMode === "dimension_add";
    const isDimensionSelectMode = interactionMode === "dimension_select";

    const setDimensionModeEnabled = useCallback(
        (enabled: boolean) => {
            setInteractionMode(enabled ? "dimension_add" : "default");
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
        (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
            if (e.target.getType() !== "Stage") return;
            if (!("button" in e.evt) || e.evt.button !== 0) return;

            if (isDimensionSelectMode) {
                setSelectedDimensionLineId(null);
                return;
            }

            if (!isDimensionAddMode) return;

            const pos = getStagePointerPos();
            if (!pos) return;

            const id = crypto.randomUUID();
            setDraftLine({
                id,
                start: pos,
                end: pos,
                color: DIMENSION_LINE_COLOR_DEFAULT,
                showUnitLabel: true,
            });
            setSelectedDimensionLineId(null);
        },
        [
            isDimensionAddMode,
            isDimensionSelectMode,
            getStagePointerPos,
            setSelectedDimensionLineId,
        ]
    );

    const onStageMouseMove = useCallback(() => {
        const pos = getStagePointerPos();
        if (!pos) return;

        setDraftLine((prev) => (prev ? { ...prev, end: pos } : prev));
    }, [getStagePointerPos]);

    const onMouseUp = useCallback(() => {
        if (!draftLine) return;

        const dx = draftLine.end.x - draftLine.start.x;
        const dy = draftLine.end.y - draftLine.start.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist >= MIN_DIMENSION_LINE_DISTANCE) {
            addDimensionLine(draftLine);
            setInteractionMode("dimension_select");
            setSelectedDimensionLineId(draftLine.id);
        } else {
            setInteractionMode("dimension_add");
            setSelectedDimensionLineId(null);
        }

        setDraftLine(null);
    }, [
        draftLine,
        addDimensionLine,
        setInteractionMode,
        setSelectedDimensionLineId,
    ]);

    const renderedDimensionLines = useMemo(() => {
        if (!draftLine) {
            return dimensionLines;
        }
        return [...dimensionLines, draftLine];
    }, [dimensionLines, draftLine]);

    // キーボードイベント処理は専用フックに委譲
    useDimensionKeyboard();

    return {
        isDimensionMode,
        isDimensionAddMode,
        isDimensionSelectMode,
        setDimensionModeEnabled,
        selectedDimensionLineId,
        setSelectedDimensionLineId,
        dimensionLines: renderedDimensionLines,
        unitFactor,
        unit,
        updateDimensionLine,
        onMouseDown: onStageMouseDown,
        onMouseMove: onStageMouseMove,
        onMouseUp,
    };
};
