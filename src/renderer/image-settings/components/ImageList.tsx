import React, { memo, useCallback } from "react";
import UUID from "uuidjs";
import { useTranslation } from "react-i18next";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import type {
  DropResult,
  DroppableProvided,
  DraggableProvided,
} from "@hello-pangea/dnd";
import { arrayMoveImmutable } from "array-move";

import { useImageSetsStore } from "../../store/useImageSetsStore";
import { useProjectStore } from "../../store/useProjectStore";

import { IconButton, Stack, Tooltip, TextField } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

import { ImageListItem } from "./ImageListItem";

/**
 * 画像設定ウィンドウの画像リスト
 * ドラッグ&ドロップで順序変更可能
 */
export const ImageList = memo(function ImageList() {
  const { t } = useTranslation();

  const { imageSets, setImageSets } = useImageSetsStore();
  const { unit_factor, setUnitFactor } = useProjectStore();

  // 新しいImageSetを追加
  const handleAddImageSet = useCallback(() => {
    const newImageSets = [...imageSets];
    newImageSets.push({
      id: UUID.generate(),
      path: "",
      transparency: 0,
      rotation: 0,
      init_anchor_pos: null,
      current_anchor_pos: null,
    });
    setImageSets(newImageSets);
  }, [setImageSets, imageSets]);

  // ドロップ実行
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }
    setImageSets(
      arrayMoveImmutable(
        imageSets,
        result.source.index,
        result.destination.index
      )
    );
  };

  return (
    <Stack direction="column" spacing={1}>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="image-list">
          {(provided: DroppableProvided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              {imageSets.map((imageSet, index) => (
                <Draggable
                  draggableId={imageSet.id}
                  index={index}
                  key={imageSet.id}
                >
                  {(provided: DraggableProvided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      style={provided.draggableProps.style}
                    >
                      <ImageListItem
                        imageSet={imageSet}
                        index={index}
                        dragHandleProps={provided.dragHandleProps}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* 画像追加ボタン */}
      <Tooltip title={t("render.image_setting_dlg.tooltip.add", "画像を追加")}>
        <IconButton
          onClick={handleAddImageSet}
          sx={{ alignSelf: "flex-start" }}
        >
          <AddIcon />
        </IconButton>
      </Tooltip>

      {/* 単位設定 */}
      <TextField
        type="number"
        label={t("render.setting_dlg.unit_factor", "単位係数")}
        value={unit_factor}
        onChange={(e) => setUnitFactor(Number(e.target.value))}
        size="small"
        sx={{
          mt: 2,
          "& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button":
            {
              WebkitAppearance: "none",
              margin: 0,
            },
        }}
        onWheel={(e: React.WheelEvent<HTMLDivElement>) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (e.target as any).blur();
        }}
      />
    </Stack>
  );
});
