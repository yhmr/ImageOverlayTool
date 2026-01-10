import React, { memo, useCallback } from "react";

import UUID from "uuidjs";
import { useTranslation } from "react-i18next";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import type {
  DraggableProvided,
  DropResult,
  DroppableProvided,
} from "@hello-pangea/dnd";
import { arrayMoveImmutable } from "array-move";

import { useDispatch } from "react-redux";
import { useSelector, RootState, AppDispatch } from "../store/store";
import { setImageSets } from "../store/imageSetsSlice";
import { setUnitFactor } from "../store/projectSlice";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Tooltip,
  TextField,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

import { ImageSettingCard } from "./ImageSettingCard";

interface ImageSettingDialogProps {
  open: boolean;
  handleClose: () => void;
}

export const ImageSettingDialog = memo(function ImageSettingDialog(
  props: ImageSettingDialogProps
) {
  const { open, handleClose } = props;

  const { t } = useTranslation();

  // image sets
  const { imageSets } = useSelector((state: RootState) => state.imageSets);
  const dispatch = useDispatch<AppDispatch>();

  // 新しいImageSetを追加
  const AddNewImageSet = useCallback(() => {
    const newImageSets = [...imageSets];
    newImageSets.push({
      id: UUID.generate(),
      path: "",
      transparency: 0,
      init_anchor_pos: null,
      current_anchor_pos: null,
    });
    dispatch(setImageSets(newImageSets));
  }, [dispatch, imageSets]);

  // ドロップ実行
  const onDragEnd = (result: DropResult) => {
    // ドロップ先がない
    if (!result.destination) {
      return;
    }
    // 入れ替えて登録
    dispatch(
      setImageSets(
        arrayMoveImmutable(
          imageSets, // 順序を入れ変えたい配列
          result.source.index, // 元の配列の位置
          result.destination.index // 移動先の配列の位置
        )
      )
    );
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth={true}>
      <DialogTitle>{t("render.image_setting_dlg.title")}</DialogTitle>
      <DialogContent>
        <Stack direction="column" spacing={1} sx={{ mt: 1 }}>
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="droppable-id">
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
                          {...provided.dragHandleProps}
                        >
                          <ImageSettingCard imageSet={imageSet} index={index} />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          <Tooltip title={t("render.image_setting_dlg.tooltip.add")}>
            <IconButton onClick={AddNewImageSet}>
              <AddIcon />
            </IconButton>
          </Tooltip>

          {/* 単位設定 */}
          <TextField
            type="number"
            label={t("render.setting_dlg.unit_factor")}
            value={useSelector((state: RootState) => state.project.unit_factor)}
            onChange={(e) => dispatch(setUnitFactor(Number(e.target.value)))}
            inputProps={{ readOnly: false }}
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
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>
          {t("render.image_setting_dlg.done")}
        </Button>
      </DialogActions>
    </Dialog>
  );
});
