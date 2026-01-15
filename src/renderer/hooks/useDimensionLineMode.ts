import { useCallback, useEffect, RefObject } from "react";
import Konva from "konva";
import { KonvaEventObject } from "konva/lib/Node";
import { useAppStore } from "../store/useAppStore";
import { DimensionLine } from "../../shared/types/DimensionLine";
import { useState } from "react"; // drawingLineIdは一時的なのでローカルに残すか、Interactionに入れるか。今回はInteractionに入れない設計だったためローカルのママでよいが、設計次第。
// 設計では "selectedDimensionLineId" はInteractionにある。 "drawingLineId" はドラッグ中のためローカルで良い。

export const useDimensionLineMode = (stageRef: RefObject<Konva.Stage>) => {
  const {
    dimensionLines,
    unitFactor,
    addDimensionLine,
    updateDimensionLine,
    removeDimensionLine,
    interactionMode,
    setInteractionMode,
    selectedDimensionLineId,
    selectDimensionLine,
  } = useAppStore();

  // Draw中は一時的なIDが必要
  const [drawingLineId, setDrawingLineId] = useState<string | null>(null);

  const isDimensionMode = interactionMode === "dimension";

  const setIsDimensionMode = useCallback(
    (enabled: boolean) => {
      setInteractionMode(enabled ? "dimension" : "default");
    },
    [setInteractionMode]
  );

  const setSelectedDimensionLineId = useCallback(
    (id: string | null) => {
      selectDimensionLine(id);
    },
    [selectDimensionLine]
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

  const onSelectDimensionLine = useCallback(
    (id: string | null) => {
      selectDimensionLine(id);
    },
    [selectDimensionLine]
  );

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
          selectDimensionLine(id);
        }
      }
    },
    [isDimensionMode, getStagePointerPos, addDimensionLine, selectDimensionLine]
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
            selectDimensionLine(null);
          }
        }
      }
      setDrawingLineId(null);
    }
  }, [drawingLineId, dimensionLines, removeDimensionLine, selectDimensionLine]);

  // Keydown handler for delete
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        selectedDimensionLineId
      ) {
        removeDimensionLine(selectedDimensionLineId);
        // selectedDimensionLineIdはstore側でnullにするようなロジックはremoveDimensionLineには含まれていない（スライスが分かれているため）。
        // なので、ここで明示的にnullにするか、あるいはInteractionSlice側で監視するか。
        // シンプルにここでnullにする。
        selectDimensionLine(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedDimensionLineId, removeDimensionLine, selectDimensionLine]);

  return {
    isDimensionMode,
    setIsDimensionMode,
    selectedDimensionLineId,
    setSelectedDimensionLineId,
    dimensionLines,
    unitFactor: unitFactor,
    onSelectDimensionLine,
    onUpdateDimensionLineHandler,
    onMouseDown: onStageMouseDown,
    onMouseMove: onStageMouseMove,
    onMouseUp,
  };
};
