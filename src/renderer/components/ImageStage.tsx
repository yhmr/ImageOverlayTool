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

import { setCanvasState } from "../store/projectSlice";

export const ImageStage = memo(function ImageStage() {
  // imageSet取得
  const { imageSets } = useSelector((state: RootState) => state.imageSets);
  const { canvas } = useSelector((state: RootState) => state.project);
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


  // 画像の選択状態
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const onSelect = useCallback((id: string) => {
    return () => {
      setSelectedImageId(id);
    };
  }, []);

  // ステージクリック時
  const onMouseDown = useCallback((e: KonvaEventObject<MouseEvent>) => {
    // ドラッグボタンを上書きし、ドラッグ有効化
    Konva.dragButtons = [1, 2];
    if (stageRef.current) {
      stageRef.current.draggable(true);
    }
    // 左クリックかつStageのクリックだった場合、選択を解除
    if (e.evt.button === 0 && e.target.getType() === "Stage") {
      setSelectedImageId(null);
    }
  }, []);

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
        </Layer>
      </Stage>
      <ControlButton selectedImageId={selectedImageId} />
    </>
  );
});
