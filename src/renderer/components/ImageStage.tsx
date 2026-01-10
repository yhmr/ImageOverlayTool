import React, { memo, useCallback, useRef, useEffect, useState } from "react";

import { useDispatch } from "react-redux";
import { useSelector, RootState, AppDispatch } from "../store/store";
import { updateImageSet } from "../store/imageSetsSlice";
import { KonvaEventObject } from "konva/lib/Node";

import Konva from "konva";
import { Stage, Layer } from "react-konva";

import { ImageSet } from "../types/ImageSet";
import { AnchorPos } from "../types/AnchorPos";
import { DrawImage } from "./DrawImage";
import { ControlButton } from "./ControlButton";
import { OverlayControls } from "./OverlayControls";
import { useStageControls } from "../hooks/useStageControls";

import { setCanvasState, addDimensionLine, updateDimensionLine, removeDimensionLine } from "../store/projectSlice";
import { DimensionLineLayer } from "./DimensionLineLayer";
import { DimensionLine } from "../../shared/types/DimensionLine";

export const ImageStage = memo(function ImageStage() {
  // imageSet取得
  const { imageSets } = useSelector((state: RootState) => state.imageSets);
  const { canvas, dimensionLines, unit_factor } = useSelector((state: RootState) => state.project);
  const dispatch = useDispatch<AppDispatch>();

  // ステージのref
  const stageRef = useRef<Konva.Stage>(null);

  // useStageControlsを使用
  // Stageの状態更新(Zoom/Pan)時にReduxへ通知するコールバック
  const onUpdateStage = useCallback((newPos: { x: number; y: number; scale: number }) => {
    dispatch(setCanvasState(newPos));
  }, [dispatch]);

  const { stageSize, handleWheel } = useStageControls(stageRef, onUpdateStage);

  // Drag End handler
  const onDragEnd = useCallback((e: KonvaEventObject<DragEvent>) => {
    if (e.target.getType() === "Stage") {
      const stage = e.target as Konva.Stage;
      onUpdateStage({
        x: stage.x(),
        y: stage.y(),
        scale: stage.scaleX()
      });
    }
  }, [onUpdateStage]);

  // Dimension Mode State
  const [isDimensionMode, setIsDimensionMode] = useState(false);
  const [selectedDimensionLineId, setSelectedDimensionLineId] = useState<string | null>(null);
  const [drawingLineId, setDrawingLineId] = useState<string | null>(null);

  const getStagePointerPos = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return null;
    const pos = stage.getPointerPosition();
    if (!pos) return null;
    const transform = stage.getAbsoluteTransform().copy();
    transform.invert();
    return transform.point(pos);
  }, []);

  const onSelectDimensionLine = useCallback((id: string | null) => {
    setSelectedDimensionLineId(id);
    if (id) {
      setSelectedImageId(null);
    }
  }, []);

  const onUpdateDimensionLineHandler = useCallback((line: DimensionLine) => {
    dispatch(updateDimensionLine(line));
  }, [dispatch]);



  // 画像の選択状態
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const onSelect = useCallback((id: string) => {
    return () => {
      if (!isDimensionMode) { // Ignore image selection in dimension mode
        setSelectedImageId(id);
        setSelectedDimensionLineId(null);
      }
    };
  }, [isDimensionMode]);

  // ステージクリック時
  const onMouseDown = useCallback((e: KonvaEventObject<MouseEvent>) => {
    // Dimension Line creation logic
    // Allow clicking on Image or Stage to start drawing.
    // If we clicked on an existing DimensionLine anchor, that should be handled by the anchor's own handler (since bubbles=true usually, but anchors catch events).
    // Actually, anchors have cancelBubble? Usually Konva shapes handle their own events if listening.
    // Let's retry checking if it's NOT a dimension line part.
    // For now, removing "Stage" check allows clicking on Images.
    if (isDimensionMode && e.evt.button === 0) {
      // Check if we clicked on an anchor or existing line?
      // Since drag events on anchors stop propagation usually if draggable=true, this might be safe.
      // But if we click on the line (Arrow) itself, we might want to select it, not draw a new one.
      // The Arrow onClick in DimensionLineLayer handles selection and calls cancelBubble = true.
      // So if we reach here, it means we didn't click on a dimension line's interactive parts.

      const pos = getStagePointerPos();
      if (pos) {
        const id = crypto.randomUUID();
        const newLine: DimensionLine = {
          id,
          start: pos,
          end: pos
        };
        dispatch(addDimensionLine(newLine));
        setDrawingLineId(id);
        setSelectedDimensionLineId(id); // Select the new line
        setSelectedImageId(null);
      }
      return;
    }

    if (!isDimensionMode) {
      // ドラッグボタンを上書きし、ドラッグ有効化
      Konva.dragButtons = [1, 2];
      if (stageRef.current) {
        stageRef.current.draggable(true);
      }
      // 左クリックかつStageのクリックだった場合、選択を解除
      if (e.evt.button === 0 && e.target.getType() === "Stage") {
        setSelectedImageId(null);
        setSelectedDimensionLineId(null); // Clear dimension selection too
      }
    } else {
      // In dimension mode, clicking stage clears selection if not creating new line (handled above)
      if (e.evt.button === 0 && e.target.getType() === "Stage") {
        setSelectedDimensionLineId(null);
        // Don't enable stage drag in dimension mode with left click
      } else if (e.evt.button === 1 || e.evt.button === 2) {
        // Allow pan with middle/right click even in dimension mode
        Konva.dragButtons = [1, 2];
        if (stageRef.current) {
          stageRef.current.draggable(true);
        }
      }
    }
  }, [isDimensionMode, getStagePointerPos, dispatch]);

  const onMouseMove = useCallback((e: KonvaEventObject<MouseEvent>) => {
    if (drawingLineId) {
      const pos = getStagePointerPos();
      if (pos && dimensionLines) {
        const line = dimensionLines.find(l => l.id === drawingLineId);
        if (line) {
          dispatch(updateDimensionLine({
            ...line,
            end: pos
          }));
        }
      }
    }
  }, [drawingLineId, getStagePointerPos, dimensionLines, dispatch]);

  const onMouseUp = useCallback((e: KonvaEventObject<MouseEvent>) => {
    if (drawingLineId) {
      if (dimensionLines) {
        const line = dimensionLines.find(l => l.id === drawingLineId);
        if (line) {
          const dx = line.end.x - line.start.x;
          const dy = line.end.y - line.start.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 2) { // Threshold for "zero length" or single click
            dispatch(removeDimensionLine(drawingLineId));
            setSelectedDimensionLineId(null); // Treat as deselect
          }
        }
      }
      setDrawingLineId(null);
    }
  }, [drawingLineId, dimensionLines, dispatch]);

  // Keydown handler for delete
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "Delete" || e.key === "Backspace") && selectedDimensionLineId) {
        dispatch(removeDimensionLine(selectedDimensionLineId));
        setSelectedDimensionLineId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedDimensionLineId, dispatch]);

  // 初期読み込み時の更新
  const onInitImage = useCallback(
    (imageSet: ImageSet, index: number) => {
      return (image: HTMLImageElement) => {
        const newImageSet = { ...imageSet };
        // データを埋める
        newImageSet.init_anchor_pos = {
          lt: { x: 0, y: 0 },
          lb: { x: 0, y: image.height },
          rt: { x: image.width, y: 0 },
          rb: { x: image.width, y: image.height },
        };
        newImageSet.current_anchor_pos = {
          lt: { x: 0, y: 0 },
          lb: { x: 0, y: image.height },
          rt: { x: image.width, y: 0 },
          rb: { x: image.width, y: image.height },
        };

        dispatch(updateImageSet({ index: index, imageSet: newImageSet }));
      };
    },
    [dispatch]
  );

  // アンカーポジションの更新
  const onUpdateAnchor = useCallback(
    (imageSet: ImageSet, index: number) => {
      return (anchor: AnchorPos) => {
        const newImageSet = { ...imageSet };
        newImageSet.current_anchor_pos = anchor;
        dispatch(updateImageSet({ index: index, imageSet: newImageSet }));
      };
    },
    [dispatch]
  );

  useEffect(() => {
    // ドラッグ終了時にドラッグ無効化
    const stage = stageRef.current;
    if (stage) {
      stage.on("dragend", () => {
        stage.draggable(false);
      });
    }
  }, []);

  useEffect(() => {
    // 選択画像が削除された場合、選択解除
    if (
      selectedImageId &&
      !imageSets.find((imageSet) => imageSet.id === selectedImageId)
    ) {
      setSelectedImageId(null);
    }
  }, [imageSets, selectedImageId]);

  return (
    <>
      <Stage
        {...stageSize}
        x={canvas.x}
        y={canvas.y}
        scaleX={canvas.scale}
        scaleY={canvas.scale}
        draggable={false}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onDragEnd={onDragEnd}
        onWheel={handleWheel}
        ref={stageRef}
      >
        <Layer>
          {imageSets.map((imageSet, index) => {
            return (
              <DrawImage
                key={index + imageSet.id}
                imageSet={imageSet}
                onInitImage={onInitImage(imageSet, index)}
                onSelect={onSelect(imageSet.id)}
              />
            );
          })}

          {selectedImageId &&
            imageSets.map((imageSet, index) => {
              if (imageSet.id === selectedImageId) {
                return (
                  <OverlayControls
                    key={"overlay-" + imageSet.id}
                    imageSet={imageSet}

                    onUpdateAnchor={onUpdateAnchor(imageSet, index)}
                    onSelect={() => { }} // Select is handled by image click, here for interface compliance
                  />
                );
              }
              return null;
            })}


          <DimensionLineLayer
            dimensionLines={dimensionLines}
            unitFactor={unit_factor}
            isSelected={(id) => id === selectedDimensionLineId}
            onSelect={onSelectDimensionLine}
            onUpdate={onUpdateDimensionLineHandler}
            isDimensionMode={isDimensionMode}
          />
        </Layer>
      </Stage>
      <ControlButton
        selectedImageId={selectedImageId}
        isDimensionMode={isDimensionMode}
        onToggleDimensionMode={() => {
          setIsDimensionMode(!isDimensionMode);
          // Clear selections when switching modes
          if (!isDimensionMode) { // Switching TO dimension mode
            setSelectedImageId(null);
          } else {
            setSelectedDimensionLineId(null);
          }
        }}
      />
    </>
  );
});
