import { useState, useCallback } from "react";

export const useMenuState = () => {
    // SettingDialog関連
    const [openSettingDlg, setOpenSettingDlg] = useState(false);
    const handleSettingDlgOpen = useCallback(() => {
        setOpenSettingDlg(true);
    }, []);
    const handleSettingDlgClose = useCallback(() => {
        setOpenSettingDlg(false);
    }, []);

    // AboutDialog関連
    const [openAboutDlg, setOpenAboutDlg] = useState(false);
    const handleAboutDlgOpen = useCallback(() => {
        setOpenAboutDlg(true);
    }, []);
    const handleAboutDlgClose = useCallback(() => {
        setOpenAboutDlg(false);
    }, []);

    return {
        openSettingDlg,
        handleSettingDlgOpen,
        handleSettingDlgClose,
        openAboutDlg,
        handleAboutDlgOpen,
        handleAboutDlgClose,
    };
};
