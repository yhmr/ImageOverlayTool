import React, { memo, useCallback } from "react";

import { useTranslation } from "react-i18next";

import { useDispatch } from "react-redux";
import { useSelector, RootState, AppDispatch } from "../../store/store";
import { updateImageSet } from "../../store/imageSetsSlice";

import { Box, IconButton, ToggleButton, Slider, Tooltip } from "@mui/material";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import TuneIcon from "@mui/icons-material/Tune";

interface ControlButtonProps {
  selectedImageId: string | null;
  isDimensionMode: boolean;
  onToggleDimensionMode: () => void;
}

export const ControlButton = memo(function ControlButton(
  props: ControlButtonProps
) {
  const { selectedImageId, isDimensionMode, onToggleDimensionMode } = props;
  const { t } = useTranslation();
  const { imageSets } = useSelector((state: RootState) => state.imageSets);
  const dispatch = useDispatch<AppDispatch>();

  // 画像設定ウィンドウを開く
  const handleOpenImageSettings = useCallback(async () => {
    await window.electronAPI.toggleImageSettingsWindow();
  }, []);

  // 透過度の操作
  const selectedImageSet = imageSets.find((set) => set.id === selectedImageId);
  const transparency = selectedImageSet?.transparency;
  const onChangeTransparency = useCallback(
    (event: Event, value: number | number[]) => {
      if (!selectedImageId || !selectedImageSet) return;
      if (typeof value !== "number") return;

      // ImageSetの透過度を更新
      const newImageSet = { ...selectedImageSet };
      newImageSet.transparency = value as number;
      dispatch(updateImageSet({ id: selectedImageId, imageSet: newImageSet }));
    },
    [dispatch, selectedImageSet, selectedImageId]
  );

  return (
    <>
      {selectedImageId && (
        <>
          {/* 画像の透過度調整 */}
          <Box
            sx={{
              position: "absolute",
              bottom: 35,
              right: 130,
              width: 200,
            }}
          >
            <Tooltip
              placement="bottom"
              title={t("render.control_button.tooltip.image_transparency")}
            >
              <Slider
                max={1}
                min={0}
                value={transparency ?? 0}
                step={0.01}
                aria-label="Default"
                valueLabelDisplay="auto"
                valueLabelFormat={(x) => Math.round(x * 100) + "%"}
                onChange={onChangeTransparency}
              />
            </Tooltip>
          </Box>
        </>
      )}

      {/* 画像設定ウィンドウを開くボタン */}
      <Tooltip
        placement="bottom"
        title={t("render.control_button.tooltip.image_settings", "画像設定 (Ctrl+I)")}
      >
        <IconButton
          sx={{
            position: "absolute",
            bottom: 30,
            right: 60,
            color: "primary.contrastText",
            backgroundColor: "rgba(0, 0, 0, 0.3)",
            "&:hover": {
              backgroundColor: "rgba(0, 0, 0, 0.5)",
            },
          }}
          onClick={handleOpenImageSettings}
        >
          <TuneIcon />
        </IconButton>
      </Tooltip>

      {/* 矢印記述ボタン */}
      <Tooltip
        placement="bottom"
        title={t("render.control_button.tooltip.dimension_line")}
      >
        <ToggleButton
          value="check"
          sx={{
            position: "absolute",
            bottom: 35,
            right: 15,
            "&, &:hover": {
              color: "primary.contrastText",
            },
            "&.Mui-selected, &.Mui-selected:hover": {
              color: "primary.contrastText",
              backgroundColor: "primary.light",
            },
          }}
          selected={isDimensionMode}
          onChange={onToggleDimensionMode}
        >
          <OpenInFullIcon color="inherit" />
        </ToggleButton>
      </Tooltip>
    </>
  );
});
