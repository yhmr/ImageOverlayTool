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

    const { isExportDialogOpen, openExportDialog, closeExportDialog } =
        useMenuState();

    const { exportImage } = useStageExport({ stageRef, setUIHidden });

    const onUpdateStage = useCallback(
        (newPos: { x: number; y: number; scale: number }) => {
            setCanvasState(newPos);
        },
        [setCanvasState]
    );

    const { stageSize, onWheel } = useStageControls(stageRef, onUpdateStage);

    const {
        isDimensionMode,
        setDimensionModeEnabled,
        selectedDimensionLineId,
        setSelectedDimensionLineId,
        dimensionLines,
        unitFactor,
        unit,
        updateDimensionLine,
        onMouseDown: onMouseDownDimension,
        onMouseMove: onMouseMoveDimension,
        onMouseUp: onMouseUpDimension,
    } = useDimensionLineMode(stageRef);

    const { selectedImageId, setSelectedImageId, createImageSelectHandler } =
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
            setSelectedImageId,
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
                onWheel={onWheel}
                ref={stageRef}
            >
                <Layer>
                    {imageSets.map((imageSet, index) => {
                        return (
                            <DrawImage
                                key={index + imageSet.id}
                                imageSet={imageSet}
                                onInitImage={onInitImage(imageSet, index)}
                                onSelect={createImageSelectHandler(imageSet.id)}
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
                        onSelect={setSelectedDimensionLineId}
                        onUpdate={updateDimensionLine}
                        isDimensionMode={isDimensionMode}
                    />
                </Layer>
            </Stage>
            <ControlButton
                isDimensionMode={isDimensionMode}
                onToggleDimensionMode={() => {
                    setDimensionModeEnabled(!isDimensionMode);
                    if (!isDimensionMode) {
                        setSelectedImageId(null);
                    } else {
                        setSelectedDimensionLineId(null);
                    }
                }}
                onOpenExportDialog={openExportDialog}
            />
            <ExportDialog
                open={isExportDialogOpen}
                onClose={closeExportDialog}
                onExport={exportImage}
            />
        </>
    );
});
