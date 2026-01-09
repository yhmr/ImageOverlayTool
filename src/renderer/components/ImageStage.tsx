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

export const ImageStage = memo(function ImageStage() {
  // imageSet取得
  const { imageSets } = useSelector((state: RootState) => state.imageSets);
  const dispatch = useDispatch<AppDispatch>();

  // ステージのref
  const stageRef = useRef<Konva.Stage>(null);

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

  // 拡大縮小
  const ZoomStage = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault(); // 通常のイベントを防ぐ
    if (stageRef.current != null) {
      const stage = stageRef.current;
      const oldScale = stage.scaleX();
      const point = stage.getPointerPosition();
      if (point) {
        const mousePointTo = {
          x: (point.x - stage.x()) / oldScale,
          y: (point.y - stage.y()) / oldScale,
        };
        const newScale = e.evt.deltaY < 0 ? oldScale * 1.1 : oldScale / 1.1; // 拡縮の倍率
        stage.scale({ x: newScale, y: newScale });
        const newPos = {
          x: point.x - mousePointTo.x * newScale,
          y: point.y - mousePointTo.y * newScale,
        };
        stage.position(newPos);
      }
    }
  }, []);

  // ステージサイズ
  const [stageSize, setStageSize] = useState({ height: 100, width: 100 });
  const handleResize = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const container = document.querySelector(".image-area")! as HTMLDivElement;
    setStageSize({
      width: container.offsetWidth,
      height: container.offsetHeight,
    });
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

  // イベント登録/解除
  useEffect(() => {
    // サイズ取得のため初めに一回発火
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [handleResize]);

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
        draggable={false}
        onMouseDown={onMouseDown}
        onWheel={ZoomStage}
        ref={stageRef}
      >
        <Layer>
          {imageSets.map((imageSet, index) => {
            return (
              <DrawImage
                key={index + imageSet.id}
                imageSet={imageSet}
                onInitImage={onInitImage(imageSet, index)}
                onUpdateAnchor={onUpdateAnchor(imageSet, index)}
                isSelected={imageSet.id === selectedImageId}
                onSelect={onSelect(imageSet.id)}
              />
            );
          })}
        </Layer>
      </Stage>
      <ControlButton selectedImageId={selectedImageId} />
    </>
  );
});
