import React, { memo } from "react";
import { useTranslation } from "react-i18next";

import { AppBar, IconButton, Toolbar, Tooltip, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

/**
 * 画像設定ウィンドウ用のシンプルなタイトルバー
 * タイトルと閉じるボタン（トグル動作）のみ
 */
export const SettingsMenuBar = memo(function SettingsMenuBar() {
    const { t } = useTranslation();

    // ウィンドウを非表示にする（トグル動作）
    const handleClose = async () => {
        await window.electronAPI.toggleImageSettingsWindow();
    };

    return (
        <AppBar position="static" sx={{ flexShrink: 0 }}>
            <Toolbar
                variant="dense"
                sx={{
                    WebkitAppRegion: "drag",
                    minHeight: 40,
                }}
            >
                {/* タイトル */}
                <Typography variant="subtitle1" component="div" sx={{ flexGrow: 1 }}>
                    {t("render.image_settings.title", "画像設定")}
                </Typography>

                {/* 閉じるボタン（トグル動作） */}
                <Tooltip title={t("render.image_settings.tooltip.close", "閉じる")}>
                    <IconButton
                        size="small"
                        color="inherit"
                        onClick={handleClose}
                        sx={{ WebkitAppRegion: "no-drag" }}
                    >
                        <CloseIcon />
                    </IconButton>
                </Tooltip>
            </Toolbar>
        </AppBar>
    );
});
