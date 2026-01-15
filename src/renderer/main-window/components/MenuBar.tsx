import React, { memo } from "react";

import { useTranslation } from "react-i18next";

import {
    AppBar,
    IconButton,
    Toolbar,
    Tooltip,
    Typography,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import CloseIcon from "@mui/icons-material/Close";

import { SettingDialog } from "./SettingDialog";
import { AppMenu } from "./AppMenu";
import { useMenuState } from "../../hooks/useMenuState";
import { useWindowOperations } from "../../hooks/useWindowOperations";
import { useProjectOperations } from "../../hooks/useProjectOperations";

export const MenuBar = memo(function MenuBar() {
    const { t } = useTranslation();

    const {
        anchorEl,
        openMenu,
        handleMenuClick,
        handleMenuClose,
        openSettingDlg,
        handleSettingDlgOpen,
        handleSettingDlgClose,
    } = useMenuState();

    const { full, handleSwitchFullScreen, handleCloseWindow } =
        useWindowOperations();

    const {
        handleNewProject,
        handleOpenProject,
        handleSaveProject,
        handleSaveProjectAs,
    } = useProjectOperations();

    return (
        <>
            <AppBar position="fixed">
                <Toolbar
                    sx={{
                        WebkitAppRegion: "drag",
                    }}
                >
                    {/* メニューボタン */}
                    <Tooltip title={t("render.menu_button.tooltip.menu")}>
                        <IconButton
                            size="large"
                            edge="start"
                            color="inherit"
                            onClick={handleMenuClick}
                            aria-controls={openMenu ? "main-menu" : undefined}
                            aria-haspopup="true"
                            aria-expanded={openMenu ? "true" : undefined}
                            sx={{ mr: 2, WebkitAppRegion: "no-drag" }}
                        >
                            <MenuIcon fontSize="large" />
                        </IconButton>
                    </Tooltip>
                    {/* タイトル */}
                    <Typography
                        variant="h6"
                        component="div"
                        sx={{ flexGrow: 1 }}
                    >
                        {t("render.menu_button.app_title")}
                    </Typography>
                    {/* 最大最小化 */}
                    <Tooltip
                        title={
                            full
                                ? t("render.menu_button.tooltip.unmaximize")
                                : t("render.menu_button.tooltip.maximize")
                        }
                    >
                        <IconButton
                            size="large"
                            color="inherit"
                            onClick={handleSwitchFullScreen}
                            sx={{ WebkitAppRegion: "no-drag" }}
                        >
                            {full ? (
                                <FullscreenExitIcon fontSize="large" />
                            ) : (
                                <FullscreenIcon fontSize="large" />
                            )}
                        </IconButton>
                    </Tooltip>
                    {/* ウィンドウ閉じる */}
                    <Tooltip title={t("render.menu_button.tooltip.close")}>
                        <IconButton
                            size="large"
                            color="inherit"
                            onClick={handleCloseWindow}
                            sx={{ mr: -1, WebkitAppRegion: "no-drag" }}
                        >
                            <CloseIcon fontSize="large" />
                        </IconButton>
                    </Tooltip>
                </Toolbar>
            </AppBar>

            <SettingDialog
                open={openSettingDlg}
                handleClose={handleSettingDlgClose}
            />
            {/* ポップアップメニュー */}
            <AppMenu
                anchorEl={anchorEl}
                openMenu={openMenu}
                handleMenuClose={handleMenuClose}
                handleSettingDlgOpen={handleSettingDlgOpen}
                handleCloseWindow={handleCloseWindow}
                handleNewProject={handleNewProject}
                handleOpenProject={handleOpenProject}
                handleSaveProject={handleSaveProject}
                handleSaveProjectAs={handleSaveProjectAs}
            />
        </>
    );
});
