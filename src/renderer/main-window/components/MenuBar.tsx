import { useTranslation } from "react-i18next";
import { useStore } from "zustand";
import type { TemporalState } from "zundo";

import { SettingDialog } from "../dialogs/settings/SettingDialog";
import { AppMenu } from "./AppMenu";
import { MenuBarHistoryActions } from "./MenuBarHistoryActions";
import { MenuBarStatusBadges } from "./MenuBarStatusBadges";
import { MenuBarWindowActions } from "./MenuBarWindowActions";
import { useMainWindowDialogState } from "../hooks/useMainWindowDialogState";
import { useWindowOperations } from "../hooks/useWindowOperations";
import { useProjectOperations } from "../hooks/useProjectOperations";
import { useImageFileStatus } from "../../hooks/useImageFileStatus";
import { useImagePaste } from "../hooks/useImagePaste";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { AboutDialog } from "../dialogs/about/AboutDialog";
import { TooltipProvider } from "@/renderer/components/ui/tooltip";
import { TITLE_BAR_HEIGHT } from "../../constants";
import { useAppStore, type AppState } from "../../store/useAppStore";
import {
    selectImageSets,
    selectIsUIHidden,
    selectSetProjectDataChangeOrigin,
} from "../../store/selectors";
import type { MainWindowActions } from "../hooks/useMainWindowActions";
import { useIpcService } from "../../providers/IpcServiceProvider";

interface MenuBarProps {
    onOpenImageExportDialog: () => void;
    onOpenWindowColorPicker: () => void;
    onApplyPresetColor?: (index: number) => void;
    mainWindowActions: MainWindowActions;
}

export function MenuBar({
    onOpenImageExportDialog,
    onOpenWindowColorPicker,
    onApplyPresetColor,
    mainWindowActions,
}: MenuBarProps) {
    const { t } = useTranslation();
    const isUIHidden = useAppStore(selectIsUIHidden);
    const imageSets = useAppStore(selectImageSets);
    const setProjectDataChangeOrigin = useAppStore(
        selectSetProjectDataChangeOrigin
    );
    const { missingCount } = useImageFileStatus(imageSets);
    const ipcService = useIpcService();

    // zundo temporal store
    const undo = useStore(
        useAppStore.temporal,
        (state: TemporalState<Partial<AppState>>) => state.undo
    );
    const redo = useStore(
        useAppStore.temporal,
        (state: TemporalState<Partial<AppState>>) => state.redo
    );
    const pastStates = useStore(
        useAppStore.temporal,
        (state: TemporalState<Partial<AppState>>) => state.pastStates
    );
    const futureStates = useStore(
        useAppStore.temporal,
        (state: TemporalState<Partial<AppState>>) => state.futureStates
    );

    const {
        isSettingDialogOpen,
        openSettingDialog,
        closeSettingDialog,
        isAboutDialogOpen,
        openAboutDialog,
        closeAboutDialog,
    } = useMainWindowDialogState();

    const { isMaximized, minimizeWindow, toggleMaximized, closeWindow } =
        useWindowOperations();

    const { newProject, openProject, saveProject, saveProjectAs } =
        useProjectOperations();
    const { pasteImage } = useImagePaste();

    const exportLogs = () => {
        void ipcService.log.export();
    };

    useKeyboardShortcuts({
        onNewProject: newProject,
        onOpenProject: openProject,
        onSaveProject: saveProject,
        onSaveProjectAs: saveProjectAs,
        onOpenImageSettings: mainWindowActions.openImageSettingsWindow,
        onPasteImage: pasteImage,
        onCaptureBackground: mainWindowActions.captureBackground,
        onOpenImageExport: onOpenImageExportDialog,
        onOpenDimensionSettings: mainWindowActions.openDimensionSettingsWindow,
        onOpenBackgroundStyle: onOpenWindowColorPicker,
        onToggleWindowFrame: mainWindowActions.toggleWindowFrameVisibility,
        onOpenSettings: openSettingDialog,
        onExportLogs: exportLogs,
        onExit: closeWindow,
        onApplyPresetColor: onApplyPresetColor,
    });

    return (
        <TooltipProvider>
            <div
                className="w-full bg-background border-b z-50 flex items-center px-2 app-region-drag select-none text-foreground"
                style={{
                    height: TITLE_BAR_HEIGHT,
                    opacity: isUIHidden ? 0 : 1,
                    transition: "opacity 0.2s",
                }}
                data-testid="main.menu.bar"
                data-clickthrough-allow
            >
                {/* メニューボタン */}
                <AppMenu
                    openSettingDialog={openSettingDialog}
                    openAboutDialog={openAboutDialog}
                    openImageExportDialog={onOpenImageExportDialog}
                    onOpenWindowColorPicker={onOpenWindowColorPicker}
                    closeWindow={closeWindow}
                    newProject={newProject}
                    openProject={openProject}
                    saveProject={saveProject}
                    saveProjectAs={saveProjectAs}
                    onExportLogs={exportLogs}
                    mainWindowActions={mainWindowActions}
                />

                <MenuBarHistoryActions
                    canUndo={pastStates.length > 0}
                    canRedo={futureStates.length > 0}
                    onUndo={() => {
                        undo();
                        setProjectDataChangeOrigin("local");
                    }}
                    onRedo={() => {
                        redo();
                        setProjectDataChangeOrigin("local");
                    }}
                />

                {/* タイトル */}
                <div className="flex-grow text-center text-lg font-medium app-region-drag pointer-events-none">
                    {t("render.menu_button.app_title")}
                </div>

                <MenuBarStatusBadges
                    missingCount={missingCount}
                    mainWindowActions={mainWindowActions}
                    t={t}
                />

                <MenuBarWindowActions
                    isMaximized={isMaximized}
                    onMinimizeWindow={minimizeWindow}
                    onToggleMaximized={toggleMaximized}
                    onCloseWindow={closeWindow}
                />

                <SettingDialog
                    open={isSettingDialogOpen}
                    onClose={closeSettingDialog}
                />
                <AboutDialog
                    open={isAboutDialogOpen}
                    onClose={closeAboutDialog}
                />
            </div>
        </TooltipProvider>
    );
}
