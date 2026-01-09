import React, { memo, useCallback } from "react";

import { useTranslation } from "react-i18next";

import { useDispatch } from "react-redux";
import { useSelector, RootState, AppDispatch } from "../store/store";
import { setImageSets, updateImageSet } from "../store/imageSetsSlice";

import { IconButton, Stack, TextField, Tooltip } from "@mui/material";
import FileOpenIcon from "@mui/icons-material/FileOpen";
import ClearIcon from "@mui/icons-material/Clear";

import { ImageSet } from "../types/ImageSet";

interface ImageSettingCardProps {
  imageSet: ImageSet;
  index: number;
}

export const ImageSettingCard = memo(function ImageSettingCard(
  props: ImageSettingCardProps
) {
  const { imageSet, index } = props;

  const { t } = useTranslation();

  // image sets
  const { imageSets } = useSelector((state: RootState) => state.imageSets);
  const dispatch = useDispatch<AppDispatch>();

  // ファイルオープンボタンをクリック
  const handleFileIconClick = useCallback(
    (index: number) => {
      return async () => {
        const res = await window.electronAPI.openFile();
        if (res) {
          const imageSet = { ...imageSets[index] };
          imageSet.path = `local-file://${res}`;
          // ファイル読み込み直しの場合は、すべてのパラメータを初期化
          imageSet.transparency = 0.0;
          imageSet.init_anchor_pos = null;
          imageSet.current_anchor_pos = null;
          dispatch(updateImageSet({ index: index, imageSet: imageSet }));
        }
      };
    },
    [dispatch, imageSets]
  );

  // ImageSetsから削除
  const handleDeleteImageSet = useCallback(
    (index: number) => {
      return () => {
        const newImageSets = [...imageSets];
        newImageSets.splice(index, 1);
        dispatch(setImageSets(newImageSets));
      };
    },
    [dispatch, imageSets]
  );

  return (
    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
      <TextField
        fullWidth
        label="path"
        inputProps={{ readOnly: true }}
        value={imageSet.path}
      />
      <Tooltip title={t("render.image_setting_dlg.tooltip.load_image")}>
        <IconButton onClick={handleFileIconClick(index)}>
          <FileOpenIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title={t("render.image_setting_dlg.tooltip.delete_image")}>
        <IconButton onClick={handleDeleteImageSet(index)}>
          <ClearIcon />
        </IconButton>
      </Tooltip>
    </Stack>
  );
});
