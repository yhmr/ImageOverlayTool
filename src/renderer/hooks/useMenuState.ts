import { useState, useCallback } from "react";

export const useMenuState = () => {
    // メニュー表示関連
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const openMenu = Boolean(anchorEl);

    const handleMenuClick = useCallback(
        (event: React.MouseEvent<HTMLElement>) => {
            setAnchorEl(event.currentTarget);
        },
        []
    );

    const handleMenuClose = useCallback(() => {
        setAnchorEl(null);
    }, []);

    // ImageSettingDialog関連
    const [openImageSettingDlg, setOpenImageSettingDlg] = useState(false);
    const handleImageSettingDlgOpen = useCallback(() => {
        setOpenImageSettingDlg(true);
    }, []);
    const handleImageSettingDlgClose = useCallback(() => {
        setOpenImageSettingDlg(false);
    }, []);

    // SettingDialog関連
    const [openSettingDlg, setOpenSettingDlg] = useState(false);
    const handleSettingDlgOpen = useCallback(() => {
        setOpenSettingDlg(true);
    }, []);
    const handleSettingDlgClose = useCallback(() => {
        setOpenSettingDlg(false);
    }, []);

    return {
        anchorEl,
        openMenu,
        handleMenuClick,
        handleMenuClose,
        openImageSettingDlg,
        handleImageSettingDlgOpen,
        handleImageSettingDlgClose,
        openSettingDlg,
        handleSettingDlgOpen,
        handleSettingDlgClose,
    };
};
