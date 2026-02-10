import { useState, useCallback } from "react";

export const useMenuState = () => {
    // SettingDialog関連
    const [isSettingDialogOpen, setIsSettingDialogOpen] = useState(false);
    const openSettingDialog = useCallback(() => {
        setIsSettingDialogOpen(true);
    }, []);
    const closeSettingDialog = useCallback(() => {
        setIsSettingDialogOpen(false);
    }, []);

    // AboutDialog関連
    const [isAboutDialogOpen, setIsAboutDialogOpen] = useState(false);
    const openAboutDialog = useCallback(() => {
        setIsAboutDialogOpen(true);
    }, []);
    const closeAboutDialog = useCallback(() => {
        setIsAboutDialogOpen(false);
    }, []);

    // ExportDialog関連
    const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
    const openExportDialog = useCallback(() => {
        setIsExportDialogOpen(true);
    }, []);
    const closeExportDialog = useCallback(() => {
        setIsExportDialogOpen(false);
    }, []);

    return {
        isSettingDialogOpen,
        openSettingDialog,
        closeSettingDialog,
        isAboutDialogOpen,
        openAboutDialog,
        closeAboutDialog,
        isExportDialogOpen,
        openExportDialog,
        closeExportDialog,
    };
};
