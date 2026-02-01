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

    // ExportDialog関連
    const [openExportDlg, setOpenExportDlg] = useState(false);
    const handleExportDlgOpen = useCallback(() => {
        setOpenExportDlg(true);
    }, []);
    const handleExportDlgClose = useCallback(() => {
        setOpenExportDlg(false);
    }, []);

    return {
        openSettingDlg,
        handleSettingDlgOpen,
        handleSettingDlgClose,
        openAboutDlg,
        handleAboutDlgOpen,
        handleAboutDlgClose,
        openExportDlg,
        handleExportDlgOpen,
        handleExportDlgClose,
    };
};
