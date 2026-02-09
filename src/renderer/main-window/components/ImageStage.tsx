"use no memo";
import React, { memo, useCallback, useRef, useEffect } from "react";

import { useAppStore } from "../../store/useAppStore";
import { KonvaEventObject } from "konva/lib/Node";

import Konva from "konva";
import { Stage, Layer } from "react-konva";

import type { ImageSet } from "../../../shared/types/ImageSet";
import type { AnchorPos } from "../../../shared/types/AnchorPos";
import { DrawImage } from "./DrawImage";
import { ControlButton } from "./ControlButton";
import { OverlayControls } from "./OverlayControls";
import { DimensionLineLayer } from "./DimensionLineLayer";
import { ExportDialog } from "./ExportDialog";
import { bindStageDragEndDisable } from "./imageStageDragEnd";

import { useStageControls } from "../../hooks/useStageControls";
import { useDimensionLineMode } from "../../hooks/useDimensionLineMode";
import { useImageSelection } from "../../hooks/useImageSelection";
import { useMenuState } from "../../hooks/useMenuState";
import { getIPCService } from "../../services/ipcService";

export const ImageStage = memo(function ImageStage() {
    // imageSet取得
    const {
        imageSets,
        updateImageSet,
        syncImageSets,
        canvas,
        setCanvasState,
        setUIHidden,
    } = useAppStore();

    // ステージのref
    const stageRef = useRef<Konva.Stage>(null);

    const { openExportDlg, handleExportDlgOpen, handleExportDlgClose } =
        useMenuState();

    const handleExport = async (includeBackground: boolean) => {
        const ipcService = getIPCService();
        if (includeBackground) {
            // UIを隠す
            setUIHidden(true);
            // ダイアログのアニメーション等を待つ
            await new Promise((resolve) => setTimeout(resolve, 500));

            try {
                await ipcService.captureWindow();
            } finally {
                // UIを戻す
                setUIHidden(false);
            }
        } else {
            const stage = stageRef.current;
            if (stage) {
                // 背景透明、高画質で保存
                // pixelRatioはディスプレイのそれに合わせるか、固定で高くするか。
                // 2くらいが丁度よい
                const dataUrl = stage.toDataURL({ pixelRatio: 2 });
                await ipcService.saveImage(dataUrl);
            }
        }
    };

    // useStageControlsを使用
    // Stageの状態更新(Zoom/Pan)時にReduxへ通知するコールバック
    const onUpdateStage = useCallback(
        (newPos: { x: number; y: number; scale: number }) => {
            setCanvasState(newPos);
        },
        [setCanvasState]
    );

    const { stageSize, handleWheel } = useStageControls(
        stageRef,
        onUpdateStage
    );

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
        unitFactor,
        unit,
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
        (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
            // dimensionモードでない場合はステージドラッグを有効化
            if (!isDimensionMode) {
                Konva.dragButtons = [1, 2];
                if (stageRef.current) {
                    stageRef.current.draggable(true);
                }
                // ステージクリックで画像選択を解除
                if (
                    "button" in e.evt &&
                    e.evt.button === 0 &&
                    e.target.getType() === "Stage"
                ) {
                    setSelectedImageId(null);
                }
            } else {
                // dimensionモードで中クリックまたは右クリックでステージドラッグを有効化
                if (
                    "button" in e.evt &&
                    (e.evt.button === 1 || e.evt.button === 2)
                ) {
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

    const onMouseMove = useCallback(() => {
        onMouseMoveDimension();
    }, [onMouseMoveDimension]);

    const onMouseUp = useCallback(() => {
        onMouseUpDimension();
    }, [onMouseUpDimension]);

    // 初期読み込み時の更新
    const onInitImage = useCallback(
        (imageSet: ImageSet, index: number) => {
            return (image: HTMLImageElement) => {
                const current = imageSets[index];
                if (!current || current.id !== imageSet.id) {
                    return;
                }

                const newImageSet = { ...current };
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

                const nextImageSets = [...imageSets];
                nextImageSets[index] = newImageSet;

                // 画像ロード時の正規化更新は履歴に積まない
                syncImageSets(nextImageSets);
                void getIPCService().updateImageSets(nextImageSets);
            };
        },
        [imageSets, syncImageSets]
    );

    // アンカーポジションの更新
    const onUpdateAnchor = useCallback(
        (imageSet: ImageSet, index: number) => {
            return (anchor: AnchorPos) => {
                const newImageSet = { ...imageSet };
                newImageSet.current_anchor_pos = anchor;
                updateImageSet({ index: index, imageSet: newImageSet });
            };
        },
        [updateImageSet]
    );

    useEffect(() => {
        const stage = stageRef.current;
        if (!stage) {
            return;
        }

        return bindStageDragEndDisable(stage);
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
                                onSelect={getOnSelectHandler(imageSet.id)}
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
                                        onUpdateAnchor={onUpdateAnchor(
                                            imageSet,
                                            index
                                        )}
                                    />
                                );
                            }
                            return null;
                        })}

                    <DimensionLineLayer
                        dimensionLines={dimensionLines}
                        unitFactor={unitFactor}
                        unit={unit}
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
                onOpenExportDialog={handleExportDlgOpen}
            />
            <ExportDialog
                open={openExportDlg}
                onClose={handleExportDlgClose}
                onExport={handleExport}
            />
        </>
    );
});
