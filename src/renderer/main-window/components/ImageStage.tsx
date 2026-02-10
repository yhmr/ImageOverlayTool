"use no memo";
import React, { memo, useCallback, useEffect, useRef } from "react";

import { useAppStore } from "../../store/useAppStore";

import Konva from "konva";
import { Stage, Layer } from "react-konva";

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
import { useStageExport } from "../hooks/useStageExport";
import { useImageInitialization } from "../hooks/useImageInitialization";
import { useStagePointerHandlers } from "../hooks/useStagePointerHandlers";

export const ImageStage = memo(function ImageStage() {
    const {
        imageSets,
        updateImageSet,
        syncImageSets,
        canvas,
        setCanvasState,
        setUIHidden,
    } = useAppStore();

    const stageRef = useRef<Konva.Stage>(null);

    const { openExportDlg, handleExportDlgOpen, handleExportDlgClose } =
        useMenuState();

    const { handleExport } = useStageExport({ stageRef, setUIHidden });

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

    const {
        isDimensionMode,
        setIsDimensionMode,
        selectedDimensionLineId,
        selectDimensionLine,
        dimensionLines,
        unitFactor,
        unit,
        updateDimensionLine,
        onMouseDown: onMouseDownDimension,
        onMouseMove: onMouseMoveDimension,
        onMouseUp: onMouseUpDimension,
    } = useDimensionLineMode(stageRef);

    const { selectedImageId, setSelectedImage, createSelectHandler } =
        useImageSelection();

    const { onInitImage, onUpdateAnchor } = useImageInitialization({
        imageSets,
        syncImageSets,
        updateImageSet,
    });

    const { onDragEnd, onMouseDown, onMouseMove, onMouseUp } =
        useStagePointerHandlers({
            stageRef,
            isDimensionMode,
            setSelectedImage,
            onMouseDownDimension,
            onMouseMoveDimension,
            onMouseUpDimension,
            onUpdateStage,
        });

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
                                onSelect={createSelectHandler(imageSet.id)}
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
                        onSelect={selectDimensionLine}
                        onUpdate={updateDimensionLine}
                        isDimensionMode={isDimensionMode}
                    />
                </Layer>
            </Stage>
            <ControlButton
                isDimensionMode={isDimensionMode}
                onToggleDimensionMode={() => {
                    setIsDimensionMode(!isDimensionMode);
                    if (!isDimensionMode) {
                        setSelectedImage(null);
                    } else {
                        selectDimensionLine(null);
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

