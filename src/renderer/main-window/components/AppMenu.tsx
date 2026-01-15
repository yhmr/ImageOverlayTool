import React, { memo, useCallback } from "react";

import { useTranslation } from "react-i18next";

import { Divider, ListItemIcon, Menu, MenuItem } from "@mui/material";
import { Logout, Settings } from "@mui/icons-material";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";

interface AppMenuProps {
    anchorEl: null | HTMLElement;
    openMenu: boolean;
    handleMenuClose: () => void;
    handleSettingDlgOpen: () => void;
    handleCloseWindow: () => void;
    handleNewProject: () => void;
    handleOpenProject: () => void;
    handleSaveProject: () => void;
    handleSaveProjectAs: () => void;
}

export const AppMenu = memo(function AppMenu(props: AppMenuProps) {
    const {
        anchorEl,
        openMenu,
        handleMenuClose,
        handleSettingDlgOpen,
        handleCloseWindow,
        handleNewProject,
        handleOpenProject,
        handleSaveProject,
        handleSaveProjectAs,
    } = props;

    const { t } = useTranslation();

    // 画像設定ウィンドウを開く
    const handleOpenImageSettings = useCallback(async () => {
        await window.electronAPI.toggleImageSettingsWindow();
    }, []);

    return (
        <Menu
            anchorEl={anchorEl}
            id="main-menu"
            open={openMenu}
            onClose={handleMenuClose}
            onClick={handleMenuClose}
            PaperProps={{
                elevation: 0,
                sx: {
                    overflow: "visible",
                    filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))",
                    mt: 1.5,
                    "&:before": {
                        content: '""',
                        display: "block",
                        position: "absolute",
                        top: 0,
                        left: 14,
                        width: 10,
                        height: 10,
                        bgcolor: "background.paper",
                        transform: "translateY(-50%) rotate(45deg)",
                        zIndex: 0,
                    },
                },
            }}
            transformOrigin={{ horizontal: "left", vertical: "top" }}
            anchorOrigin={{ horizontal: "left", vertical: "bottom" }}
        >
            <MenuItem onClick={handleNewProject}>
                <ListItemIcon>
                    {/* Add Icon later if needed or skip */}
                </ListItemIcon>
                {t("render.menu.new_project")}
            </MenuItem>
            <MenuItem onClick={handleOpenProject}>
                <ListItemIcon></ListItemIcon>
                {t("render.menu.open_project")}
            </MenuItem>
            <MenuItem onClick={handleSaveProject}>
                <ListItemIcon></ListItemIcon>
                {t("render.menu.save_project")}
            </MenuItem>
            <MenuItem onClick={handleSaveProjectAs}>
                <ListItemIcon></ListItemIcon>
                {t("render.menu.save_project_as")}
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleOpenImageSettings}>
                <ListItemIcon>
                    <AddPhotoAlternateIcon fontSize="small" />
                </ListItemIcon>
                {t("render.menu.load_image")}
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleSettingDlgOpen}>
                <ListItemIcon>
                    <Settings fontSize="small" />
                </ListItemIcon>
                {t("render.menu.settings")}
            </MenuItem>
            <MenuItem onClick={handleCloseWindow}>
                <ListItemIcon>
                    <Logout fontSize="small" />
                </ListItemIcon>
                {t("render.menu.exit")}
            </MenuItem>
        </Menu>
    );
});
