import React, { memo, useCallback, useEffect, useRef } from "react";

import { useAppStore } from "../../store/useAppStore";
import {
    selectCanvas,
    selectImageSets,
    selectSetCanvasState,
    selectSetUIHidden,
    selectSyncImageSets,
    selectUpdateImageSet,
} from "../../store/selectors";

import Konva from "konva";
import { Stage, Layer } from "react-konva";

import { DrawImage } from "./DrawImage";
import { ControlButton } from "./ControlButton";
import { OverlayControls } from "./OverlayControls";
import { DimensionLineLayer } from "./DimensionLineLayer";
import { ImageExportDialog } from "../../dialogs/export/ImageExportDialog";
import { bindStageDragEndDisable } from "./imageStageDragEnd";

import { useStageControls } from "../../hooks/useStageControls";
import { useDimensionLineMode } from "../../hooks/useDimensionLineMode";
import { useImageSelection } from "../../hooks/useImageSelection";
import { useClickThroughMode } from "../../hooks/useClickThroughMode";
import { useStageExport } from "../hooks/useStageExport";
import { useImageInitialization } from "../hooks/useImageInitialization";
import { useStagePointerHandlers } from "../hooks/useStagePointerHandlers";
import type { MainWindowActions } from "../hooks/useMainWindowActions";

interface ImageStageProps {
    isImageExportDialogOpen: boolean;
    onOpenImageExportDialog: () => void;
    onCloseImageExportDialog: () => void;
    onOpenWindowColorPicker: () => void;
    mainWindowActions: MainWindowActions;
}

export const ImageStage = memo(function ImageStage(props: ImageStageProps) {
    "use no memo";

    const {
        isImageExportDialogOpen,
        onOpenImageExportDialog,
        onCloseImageExportDialog,
        onOpenWindowColorPicker,
        mainWindowActions,
    } = props;
    const imageSets = useAppStore(selectImageSets);
    const updateImageSet = useAppStore(selectUpdateImageSet);
    const syncImageSets = useAppStore(selectSyncImageSets);
    const canvas = useAppStore(selectCanvas);
    const setCanvasState = useAppStore(selectSetCanvasState);
    const setUIHidden = useAppStore(selectSetUIHidden);

    const stageRef = useRef<Konva.Stage>(null);

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
        isDimensionSelectMode,
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

    useClickThroughMode();

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
                        // visible が false の場合は描画しない
                        if (imageSet.visible === false) return null;
                        return (
                            <DrawImage
                                key={imageSet.id}
                                imageSet={imageSet}
                                onInitImage={onInitImage(imageSet, index)}
                                onSelect={createImageSelectHandler(imageSet.id)}
                            />
                        );
                    })}

                    {selectedImageId &&
                        imageSets.map((imageSet, index) => {
                            if (
                                imageSet.id === selectedImageId &&
                                imageSet.visible !== false
                            ) {
                                return (
                                    <OverlayControls
                                        key={imageSet.id}
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
                        isDimensionEditMode={isDimensionSelectMode}
                    />
                </Layer>
            </Stage>
            <ControlButton
                onOpenImageExportDialog={onOpenImageExportDialog}
                onOpenWindowColorPicker={onOpenWindowColorPicker}
                mainWindowActions={mainWindowActions}
            />
            <ImageExportDialog
                open={isImageExportDialogOpen}
                onClose={onCloseImageExportDialog}
                onExport={exportImage}
            />
        </>
    );
});
