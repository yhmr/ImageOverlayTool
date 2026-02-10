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
        isSettingDialogOpen,
        openSettingDialog,
        closeSettingDialog,
        isAboutDialogOpen,
        openAboutDialog,
        closeAboutDialog,
    } = useMenuState();

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
            >
                {/* メニューボタン */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="mr-2">
                            <AppMenu
                                openSettingDialog={openSettingDialog}
                                openAboutDialog={openAboutDialog}
                                closeWindow={closeWindow}
                                newProject={newProject}
                                openProject={openProject}
                                saveProject={saveProject}
                                saveProjectAs={saveProjectAs}
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
                                data-testid="main.action.undo"
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
                                data-testid="main.action.redo"
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
                            onClick={toggleMaximized}
                            className="app-region-no-drag"
                            data-testid="main.action.window-toggle"
                        >
                            {isMaximized ? (
                                <Minimize className="h-6 w-6" />
                            ) : (
                                <Maximize className="h-6 w-6" />
                            )}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>
                            {isMaximized
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
                            onClick={closeWindow}
                            className="app-region-no-drag hover:bg-destructive hover:text-destructive-foreground"
                            data-testid="main.action.window-close"
                        >
                            <X className="h-6 w-6" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{t("render.menu_button.tooltip.close")}</p>
                    </TooltipContent>
                </Tooltip>

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
