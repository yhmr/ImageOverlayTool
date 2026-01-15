import React, { memo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Box, ToggleButton, Tooltip } from "@mui/material";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import TuneIcon from "@mui/icons-material/Tune";

interface ControlButtonProps {
    isDimensionMode: boolean;
    onToggleDimensionMode: () => void;
}

export const ControlButton = memo(function ControlButton(
    props: ControlButtonProps
) {
    const { isDimensionMode, onToggleDimensionMode } = props;
    const { t } = useTranslation();

    // 画像設定ウィンドウを開く
    const handleOpenImageSettings = useCallback(async () => {
        await window.electronAPI.toggleImageSettingsWindow();
    }, []);

    const buttonStyle = {
        color: "primary.contrastText",
        backgroundColor: "rgba(0, 0, 0, 0.3)",
        "&:hover": {
            backgroundColor: "rgba(0, 0, 0, 0.5)",
        },
        "&.Mui-selected, &.Mui-selected:hover": {
            color: "primary.contrastText",
            backgroundColor: "primary.light",
        },
    };

    return (
        <Box>
            {/* 画像設定ウィンドウを開くボタン */}
            <Tooltip
                placement="bottom"
                title={t(
                    "render.control_button.tooltip.image_settings",
                    "画像設定 (Ctrl+I)"
                )}
            >
                <ToggleButton
                    value="settings"
                    sx={{
                        ...buttonStyle,
                        position: "absolute",
                        bottom: 35,
                        right: 80,
                    }}
                    selected={false}
                    onChange={handleOpenImageSettings}
                >
                    <TuneIcon />
                </ToggleButton>
            </Tooltip>

            {/* 矢印記述ボタン */}
            <Tooltip
                placement="bottom"
                title={t("render.control_button.tooltip.dimension_line")}
            >
                <ToggleButton
                    value="check"
                    sx={{
                        ...buttonStyle,
                        position: "absolute",
                        bottom: 35,
                        right: 15,
                    }}
                    selected={isDimensionMode}
                    onChange={onToggleDimensionMode}
                >
                    <OpenInFullIcon color="inherit" />
                </ToggleButton>
            </Tooltip>
        </Box>
    );
});
