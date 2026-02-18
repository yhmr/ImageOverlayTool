import { useTranslation } from "react-i18next";
import { useStore } from "zustand";
import type { TemporalState } from "zundo";

import { SettingDialog } from "../../dialogs/settings/SettingDialog";
import { AppMenu } from "./AppMenu";
import { MenuBarHistoryActions } from "./MenuBarHistoryActions";
import { MenuBarWindowActions } from "./MenuBarWindowActions";
import { useMainWindowDialogState } from "../../hooks/useMainWindowDialogState";
import { useWindowOperations } from "../../hooks/useWindowOperations";
import { useProjectOperations } from "../../hooks/useProjectOperations";
import { useImageFileStatus } from "../../hooks/useImageFileStatus";
import { useIpcService } from "../../providers/IpcServiceProvider";
import { AboutDialog } from "../../dialogs/about/AboutDialog";
import { Button } from "@/renderer/components/ui/button";
import { TooltipProvider } from "@/renderer/components/ui/tooltip";
import { TITLE_BAR_HEIGHT } from "../../constants";
import { useAppStore, type AppState } from "../../store/useAppStore";

interface MenuBarProps {
    onOpenImageExportDialog: () => void;
}

export function MenuBar({ onOpenImageExportDialog }: MenuBarProps) {
    const { t } = useTranslation();
    const { isUIHidden, isClickThroughMode, setClickThroughMode, imageSets } =
        useAppStore();
    const ipcService = useIpcService();
    const { missingCount } = useImageFileStatus(imageSets);

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

    const { isMaximized, toggleMaximized, closeWindow } = useWindowOperations();

    const { newProject, openProject, saveProject, saveProjectAs } =
        useProjectOperations();

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
                    closeWindow={closeWindow}
                    newProject={newProject}
                    openProject={openProject}
                    saveProject={saveProject}
                    saveProjectAs={saveProjectAs}
                />

                <MenuBarHistoryActions
                    canUndo={pastStates.length > 0}
                    canRedo={futureStates.length > 0}
                    onUndo={() => {
                        undo();
                        useAppStore.setState({
                            projectDataChangeOrigin: "local",
                        });
                    }}
                    onRedo={() => {
                        redo();
                        useAppStore.setState({
                            projectDataChangeOrigin: "local",
                        });
                    }}
                />

                {/* タイトル */}
                <div className="flex-grow text-center text-lg font-medium app-region-drag pointer-events-none">
                    {t("render.menu_button.app_title")}
                </div>

                {missingCount > 0 && (
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={() =>
                            void ipcService.toggleImageSettingsWindow()
                        }
                        className="mr-2 app-region-no-drag"
                        data-testid="main.status.missing-images"
                        data-clickthrough-allow
                    >
                        {t("render.image_status.missing_summary", {
                            count: missingCount,
                        })}
                    </Button>
                )}

                {isClickThroughMode && (
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setClickThroughMode(false)}
                        className="mr-2 app-region-no-drag bg-amber-500/90 text-amber-950 hover:bg-amber-500"
                        data-testid="main.status.click-through-mode"
                        data-clickthrough-allow
                    >
                        {t(
                            "render.menu_button.status.click_through_mode_active"
                        )}
                    </Button>
                )}

                <MenuBarWindowActions
                    isMaximized={isMaximized}
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
