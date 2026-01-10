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
        openSettingDlg,
        handleSettingDlgOpen,
        handleSettingDlgClose,
    };
};
