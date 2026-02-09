import { useTranslation } from "react-i18next";
import { Maximize, Minimize, X, Undo, Redo } from "lucide-react";
import { useStore } from "zustand";
import type { TemporalState } from "zundo";

import { SettingDialog } from "./SettingDialog";
import { AboutDialog } from "./AboutDialog";
import { AppMenu } from "./AppMenu";
import { useMenuState } from "../../hooks/useMenuState";
import { useWindowOperations } from "../../hooks/useWindowOperations";
import { useProjectOperations } from "../../hooks/useProjectOperations";
import { Button } from "@/renderer/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/renderer/components/ui/tooltip";
import { TITLE_BAR_HEIGHT } from "../../constants";
import { useAppStore, type AppState } from "../../store/useAppStore";

export function MenuBar() {
    const { t } = useTranslation();
    const { isUIHidden } = useAppStore();

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
        openSettingDlg,
        handleSettingDlgOpen,
        handleSettingDlgClose,
        openAboutDlg,
        handleAboutDlgOpen,
        handleAboutDlgClose,
    } = useMenuState();

    const { full, handleSwitchFullScreen, handleCloseWindow } =
        useWindowOperations();

    const {
        handleNewProject,
        handleOpenProject,
        handleSaveProject,
        handleSaveProjectAs,
    } = useProjectOperations();

    return (
        <TooltipProvider>
            <div
                className="w-full bg-background border-b z-50 flex items-center px-2 app-region-drag select-none text-foreground"
                style={{
                    height: TITLE_BAR_HEIGHT,
                    opacity: isUIHidden ? 0 : 1,
                    transition: "opacity 0.2s",
                }}
            >
                {/* メニューボタン */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="mr-2">
                            {" "}
                            {/* Wrapper for TooltipTrigger asChild issue if any, or just direct AppMenu */}
                            <AppMenu
                                handleSettingDlgOpen={handleSettingDlgOpen}
                                handleAboutDlgOpen={handleAboutDlgOpen}
                                handleCloseWindow={handleCloseWindow}
                                handleNewProject={handleNewProject}
                                handleOpenProject={handleOpenProject}
                                handleSaveProject={handleSaveProject}
                                handleSaveProjectAs={handleSaveProjectAs}
                            />
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{t("render.menu_button.tooltip.menu")}</p>
                    </TooltipContent>
                </Tooltip>

                {/* Undo / Redo */}
                <div className="flex items-center gap-1 app-region-no-drag">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => undo()}
                                disabled={pastStates.length === 0}
                                className="h-8 w-8"
                            >
                                <Undo className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{t("common.undo", "Undo")}</p>
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => redo()}
                                disabled={futureStates.length === 0}
                                className="h-8 w-8"
                            >
                                <Redo className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{t("common.redo", "Redo")}</p>
                        </TooltipContent>
                    </Tooltip>
                </div>

                {/* タイトル */}
                <div className="flex-grow text-center text-lg font-medium app-region-drag pointer-events-none">
                    {t("render.menu_button.app_title")}
                </div>

                {/* 最大最小化 */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleSwitchFullScreen}
                            className="app-region-no-drag"
                        >
                            {full ? (
                                <Minimize className="h-6 w-6" />
                            ) : (
                                <Maximize className="h-6 w-6" />
                            )}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>
                            {full
                                ? t("render.menu_button.tooltip.unmaximize")
                                : t("render.menu_button.tooltip.maximize")}
                        </p>
                    </TooltipContent>
                </Tooltip>

                {/* ウィンドウ閉じる */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleCloseWindow}
                            className="app-region-no-drag hover:bg-destructive hover:text-destructive-foreground"
                        >
                            <X className="h-6 w-6" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{t("render.menu_button.tooltip.close")}</p>
                    </TooltipContent>
                </Tooltip>

                <SettingDialog
                    open={openSettingDlg}
                    handleClose={handleSettingDlgClose}
                />
                <AboutDialog
                    open={openAboutDlg}
                    handleClose={handleAboutDlgClose}
                />
            </div>
        </TooltipProvider>
    );
}
