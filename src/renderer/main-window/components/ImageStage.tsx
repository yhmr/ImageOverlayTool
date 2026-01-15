import React, { memo, useCallback, useRef, useEffect } from "react";

import { useDispatch } from "react-redux";
import { useSelector, RootState, AppDispatch } from "../../store/store";
import { updateImageSet } from "../../store/imageSetsSlice";
import { setCanvasState } from "../../store/projectSlice";
import { KonvaEventObject } from "konva/lib/Node";

import Konva from "konva";
import { Stage, Layer } from "react-konva";

import type { ImageSet } from "../../types/ImageSet";
import type { AnchorPos } from "../../types/AnchorPos";
import { DrawImage } from "./DrawImage";
import { ControlButton } from "./ControlButton";
import { OverlayControls } from "./OverlayControls";
import { DimensionLineLayer } from "./DimensionLineLayer";

import { useStageControls } from "../../hooks/useStageControls";
import { useDimensionLineMode } from "../../hooks/useDimensionLineMode";
import { useImageSelection } from "../../hooks/useImageSelection";

export const ImageStage = memo(function ImageStage() {
  // imageSet取得
  const { imageSets } = useSelector((state: RootState) => state.imageSets);
  const { canvas } = useSelector((state: RootState) => state.project);
  const dispatch = useDispatch<AppDispatch>();

  // ステージのref
  const stageRef = useRef<Konva.Stage>(null);

  // useStageControlsを使用
  // Stageの状態更新(Zoom/Pan)時にReduxへ通知するコールバック
  const onUpdateStage = useCallback(
    (newPos: { x: number; y: number; scale: number }) => {
      dispatch(setCanvasState(newPos));
    },
    [dispatch]
  );

  const { stageSize, handleWheel } = useStageControls(stageRef, onUpdateStage);

  // Drag End handler
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

  // Custom hooks
  const {
    isDimensionMode,
    setIsDimensionMode,
    selectedDimensionLineId,
    setSelectedDimensionLineId,
    dimensionLines,
    unit_factor,
    onSelectDimensionLine,
    onUpdateDimensionLineHandler,
    onMouseDown: onMouseDownDimension,
    onMouseMove: onMouseMoveDimension,
    onMouseUp: onMouseUpDimension,
  } = useDimensionLineMode(stageRef);

  const { selectedImageId, setSelectedImageId, getOnSelectHandler } =
    useImageSelection();

  // Handlers wrapper
  const onMouseDown = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      // dimensionモードでない場合はステージドラッグを有効化
      if (!isDimensionMode) {
        Konva.dragButtons = [1, 2];
        if (stageRef.current) {
          stageRef.current.draggable(true);
        }
        // ステージクリックで画像選択を解除
        if (e.evt.button === 0 && e.target.getType() === "Stage") {
          setSelectedImageId(null);
        }
      } else {
        // dimensionモードで中クリックまたは右クリックでステージドラッグを有効化
        if (e.evt.button === 1 || e.evt.button === 2) {
          Konva.dragButtons = [1, 2];
          if (stageRef.current) {
            stageRef.current.draggable(true);
          }
        }
      }

      // dimensionモードのハンドラーを呼び出す
      onMouseDownDimension(e);
    },
    [isDimensionMode, onMouseDownDimension, setSelectedImageId]
  );

  const onMouseMove = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      onMouseMoveDimension(e);
    },
    [onMouseMoveDimension]
  );

  const onMouseUp = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      onMouseUpDimension(e);
    },
    [onMouseUpDimension]
  );

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
                onSelect={getOnSelectHandler(imageSet.id, isDimensionMode, () =>
                  setSelectedDimensionLineId(null)
                )}
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
        isDimensionMode={isDimensionMode}
        onToggleDimensionMode={() => {
          setIsDimensionMode(!isDimensionMode);
          // dimensionモード切り替え時に選択を解除
          if (!isDimensionMode) {
            // dimensionモードへ切り替え
            setSelectedImageId(null);
          } else {
            setSelectedDimensionLineId(null);
          }
        }}
      />
    </>
  );
});
