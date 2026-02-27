import { useState, useCallback } from "react";

export const useMainWindowDialogState = () => {
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

    // ImageExportDialog関連
    const [isImageExportDialogOpen, setIsImageExportDialogOpen] =
        useState(false);
    const openImageExportDialog = useCallback(() => {
        setIsImageExportDialogOpen(true);
    }, []);
    const closeImageExportDialog = useCallback(() => {
        setIsImageExportDialogOpen(false);
    }, []);

    return {
        isSettingDialogOpen,
        openSettingDialog,
        closeSettingDialog,
        isAboutDialogOpen,
        openAboutDialog,
        closeAboutDialog,
        isImageExportDialogOpen,
        openImageExportDialog,
        closeImageExportDialog,
    };
};
