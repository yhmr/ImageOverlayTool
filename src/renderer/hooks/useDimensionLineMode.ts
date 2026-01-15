import { useState, useCallback, useEffect, RefObject } from "react";
import Konva from "konva";
import { KonvaEventObject } from "konva/lib/Node";
import { useProjectStore } from "../store/useProjectStore";
import { DimensionLine } from "../../shared/types/DimensionLine";

export const useDimensionLineMode = (stageRef: RefObject<Konva.Stage>) => {
  const {
    dimensionLines,
    unit_factor,
    addDimensionLine,
    updateDimensionLine,
    removeDimensionLine,
  } = useProjectStore();

  const [isDimensionMode, setIsDimensionMode] = useState(false);
  const [selectedDimensionLineId, setSelectedDimensionLineId] = useState<
    string | null
  >(null);
  const [drawingLineId, setDrawingLineId] = useState<string | null>(null);

  const getStagePointerPos = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return null;
    const pos = stage.getPointerPosition();
    if (!pos) return null;
    const transform = stage.getAbsoluteTransform().copy();
    transform.invert();
    return transform.point(pos);
  }, [stageRef]);

  const onSelectDimensionLine = useCallback((id: string | null) => {
    setSelectedDimensionLineId(id);
  }, []);

  const onUpdateDimensionLineHandler = useCallback(
    (line: DimensionLine) => {
      updateDimensionLine(line);
    },
    [updateDimensionLine]
  );

  const onStageMouseDown = useCallback(
    (_e: KonvaEventObject<MouseEvent>) => {
      if (!isDimensionMode) return;
      // If left click
      if (_e.evt.button === 0) {
        const pos = getStagePointerPos();
        if (pos) {
          const id = crypto.randomUUID();
          const newLine: DimensionLine = {
            id,
            start: pos,
            end: pos,
          };
          addDimensionLine(newLine);
          setDrawingLineId(id);
          setSelectedDimensionLineId(id);
        }
      }
    },
    [isDimensionMode, getStagePointerPos, addDimensionLine]
  );

  const onStageMouseMove = useCallback(() => {
    if (drawingLineId) {
      const pos = getStagePointerPos();
      if (pos && dimensionLines) {
        const line = dimensionLines.find((l) => l.id === drawingLineId);
        if (line) {
          updateDimensionLine({
            ...line,
            end: pos,
          });
        }
      }
    }
  }, [drawingLineId, getStagePointerPos, dimensionLines, updateDimensionLine]);

  const onMouseUp = useCallback(() => {
    if (drawingLineId) {
      if (dimensionLines) {
        const line = dimensionLines.find((l) => l.id === drawingLineId);
        if (line) {
          const dx = line.end.x - line.start.x;
          const dy = line.end.y - line.start.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 2) {
            removeDimensionLine(drawingLineId);
            setSelectedDimensionLineId(null);
          }
        }
      }
      setDrawingLineId(null);
    }
  }, [drawingLineId, dimensionLines, removeDimensionLine]);

  // Keydown handler for delete
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        selectedDimensionLineId
      ) {
        removeDimensionLine(selectedDimensionLineId);
        setSelectedDimensionLineId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedDimensionLineId, removeDimensionLine]);

  return {
    isDimensionMode,
    setIsDimensionMode,
    selectedDimensionLineId,
    setSelectedDimensionLineId,
    dimensionLines,
    unit_factor,
    onSelectDimensionLine,
    onUpdateDimensionLineHandler,
    onMouseDown: onStageMouseDown,
    onMouseMove: onStageMouseMove,
    onMouseUp,
  };
};
