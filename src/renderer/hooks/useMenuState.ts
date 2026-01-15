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

    return {
        openSettingDlg,
        handleSettingDlgOpen,
        handleSettingDlgClose,
    };
};
