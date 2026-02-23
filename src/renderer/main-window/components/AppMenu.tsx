import { useTranslation } from "react-i18next";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuTrigger,
} from "@/renderer/components/ui/dropdown-menu";
import { Button } from "@/renderer/components/ui/button";
import {
    Menu as MenuIcon,
    Settings,
    LogOut,
    Settings2,
    Info,
    BookOpen,
    FileDown,
    FilePlus,
    FolderOpen,
    Save,
    SaveAll,
    Maximize2,
    ClipboardPaste,
    Ruler,
    Camera,
    Droplets,
    Ghost,
    Pin,
    Square,
} from "lucide-react";

import { useFitToScreen } from "../../hooks/useFitToScreen";
import { useImagePaste } from "../../hooks/useImagePaste";
import {
    MAIN_WINDOW_SHORTCUT_LABELS,
    type MainWindowShortcutLabelKey,
} from "../../hooks/useKeyboardShortcuts";
import type { MainWindowActions } from "../hooks/useMainWindowActions";

interface AppMenuProps {
    openSettingDialog: () => void;
    openAboutDialog: () => void;
    openImageExportDialog: () => void;
    onOpenWindowColorPicker: () => void;
    closeWindow: () => void;
    newProject: () => void;
    openProject: () => void;
    saveProject: () => void;
    saveProjectAs: () => void;
    onExportLogs: () => void;
    mainWindowActions: MainWindowActions;
}

export function AppMenu(props: AppMenuProps) {
    const {
        openSettingDialog,
        openAboutDialog,
        openImageExportDialog,
        onOpenWindowColorPicker,
        closeWindow,
        newProject,
        openProject,
        saveProject,
        saveProjectAs,
        onExportLogs,
        mainWindowActions,
    } = props;

    const { t } = useTranslation();
    const { fitToScreen } = useFitToScreen();
    const { pasteImage } = useImagePaste();
    const shortcut = (key: MainWindowShortcutLabelKey): string =>
        MAIN_WINDOW_SHORTCUT_LABELS[key];

    const openUserGuide = () => {
        window.open("https://yhmr.github.io/ImageOverlayTool/guide/", "_blank");
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="mr-2 app-region-no-drag"
                    data-testid="main.menu.trigger"
                >
                    <MenuIcon className="h-6 w-6" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="start"
                sideOffset={5}
                data-testid="main.menu.content"
            >
                {/* プロジェクト グループ */}
                <DropdownMenuLabel>
                    {t("render.menu.group_project")}
                </DropdownMenuLabel>
                <DropdownMenuGroup>
                    <DropdownMenuItem
                        onClick={newProject}
                        data-testid="main.menu.item.new-project"
                    >
                        <FilePlus className="mr-2 h-4 w-4" />
                        {t("render.menu.new_project")}
                        <DropdownMenuShortcut>
                            {shortcut("newProject")}
                        </DropdownMenuShortcut>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={openProject}
                        data-testid="main.menu.item.open-project"
                    >
                        <FolderOpen className="mr-2 h-4 w-4" />
                        {t("render.menu.open_project")}
                        <DropdownMenuShortcut>
                            {shortcut("openProject")}
                        </DropdownMenuShortcut>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={saveProject}
                        data-testid="main.menu.item.save-project"
                    >
                        <Save className="mr-2 h-4 w-4" />
                        {t("render.menu.save_project")}
                        <DropdownMenuShortcut>
                            {shortcut("saveProject")}
                        </DropdownMenuShortcut>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={saveProjectAs}
                        data-testid="main.menu.item.save-project-as"
                    >
                        <SaveAll className="mr-2 h-4 w-4" />
                        {t("render.menu.save_project_as")}
                        <DropdownMenuShortcut>
                            {shortcut("saveProjectAs")}
                        </DropdownMenuShortcut>
                    </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                {/* 画像 グループ */}
                <DropdownMenuLabel>
                    {t("render.menu.group_image")}
                </DropdownMenuLabel>
                <DropdownMenuGroup>
                    <DropdownMenuItem
                        onClick={mainWindowActions.openImageSettingsWindow}
                        data-testid="main.menu.item.open-image-settings"
                    >
                        <Settings2 className="mr-2 h-4 w-4" />
                        {t("render.menu.open_image_settings")}
                        <DropdownMenuShortcut>
                            {shortcut("openImageSettings")}
                        </DropdownMenuShortcut>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={fitToScreen}
                        data-testid="main.menu.item.fit-screen"
                    >
                        <Maximize2 className="mr-2 h-4 w-4" />
                        {t("render.menu.fit_screen")}
                        <DropdownMenuShortcut>
                            {shortcut("fitToScreen")}
                        </DropdownMenuShortcut>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => void pasteImage()}
                        data-testid="main.menu.item.paste-image"
                    >
                        <ClipboardPaste className="mr-2 h-4 w-4" />
                        {t("render.menu.paste_image")}
                        <DropdownMenuShortcut>
                            {shortcut("pasteImage")}
                        </DropdownMenuShortcut>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={mainWindowActions.captureBackground}
                        data-testid="main.menu.item.capture-background"
                    >
                        <Camera className="mr-2 h-4 w-4" />
                        {t("render.menu.capture_background")}
                        <DropdownMenuShortcut>
                            {shortcut("captureBackground")}
                        </DropdownMenuShortcut>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={openImageExportDialog}
                        data-testid="main.menu.item.export-image"
                    >
                        <Save className="mr-2 h-4 w-4" />
                        {t("render.menu.export_image")}
                        <DropdownMenuShortcut>
                            {shortcut("exportImage")}
                        </DropdownMenuShortcut>
                    </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                {/* 寸法線 グループ */}
                <DropdownMenuLabel>
                    {t("render.menu.group_dimension")}
                </DropdownMenuLabel>
                <DropdownMenuGroup>
                    <DropdownMenuItem
                        onClick={mainWindowActions.openDimensionSettingsWindow}
                        data-testid="main.menu.item.open-dimension-settings"
                    >
                        <Ruler className="mr-2 h-4 w-4" />
                        {t("render.menu.open_dimension_settings")}
                        <DropdownMenuShortcut>
                            {shortcut("openDimensionSettings")}
                        </DropdownMenuShortcut>
                    </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                {/* 表示 グループ */}
                <DropdownMenuLabel>
                    {t("render.menu.group_view")}
                </DropdownMenuLabel>
                <DropdownMenuGroup>
                    <DropdownMenuItem
                        onClick={onOpenWindowColorPicker}
                        data-testid="main.menu.item.background-style"
                    >
                        <Droplets className="mr-2 h-4 w-4" />
                        {t("render.menu.background_style")}
                        <DropdownMenuShortcut>
                            {shortcut("openBackgroundStyle")}
                        </DropdownMenuShortcut>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={mainWindowActions.toggleAlwaysOnTopMode}
                        data-testid="main.menu.item.always-on-top"
                    >
                        <Pin className="mr-2 h-4 w-4" />
                        {mainWindowActions.isAlwaysOnTopMode
                            ? t("render.menu.always_on_top_disable")
                            : t("render.menu.always_on_top_enable")}
                        <DropdownMenuShortcut>
                            {shortcut("toggleAlwaysOnTopMode")}
                        </DropdownMenuShortcut>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => {
                            if (!mainWindowActions.canToggleClickThroughMode) {
                                return;
                            }
                            mainWindowActions.toggleClickThroughMode();
                        }}
                        disabled={!mainWindowActions.canToggleClickThroughMode}
                        data-testid="main.menu.item.click-through-mode"
                    >
                        <Ghost className="mr-2 h-4 w-4" />
                        {mainWindowActions.isClickThroughMode
                            ? t("render.menu.click_through_mode_disable")
                            : t("render.menu.click_through_mode_enable")}
                        <DropdownMenuShortcut>
                            {shortcut("toggleClickThroughMode")}
                        </DropdownMenuShortcut>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={mainWindowActions.toggleWindowFrameVisibility}
                        data-testid="main.menu.item.window-frame"
                    >
                        <Square className="mr-2 h-4 w-4" />
                        {mainWindowActions.isWindowFrameVisible
                            ? t("render.menu.window_frame_hide")
                            : t("render.menu.window_frame_show")}
                        <DropdownMenuShortcut>
                            {shortcut("toggleWindowFrame")}
                        </DropdownMenuShortcut>
                    </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                {/* システム グループ */}
                <DropdownMenuLabel>
                    {t("render.menu.group_system")}
                </DropdownMenuLabel>
                <DropdownMenuGroup>
                    <DropdownMenuItem
                        onClick={openSettingDialog}
                        data-testid="main.menu.item.settings"
                    >
                        <Settings className="mr-2 h-4 w-4" />
                        {t("render.menu.settings")}
                        <DropdownMenuShortcut>
                            {shortcut("openSettings")}
                        </DropdownMenuShortcut>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={onExportLogs}
                        data-testid="main.menu.item.export-logs"
                    >
                        <FileDown className="mr-2 h-4 w-4" />
                        {t("render.menu.export_logs")}
                        <DropdownMenuShortcut>
                            {shortcut("exportLogs")}
                        </DropdownMenuShortcut>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={closeWindow}
                        data-testid="main.menu.item.exit"
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        {t("render.menu.exit")}
                        <DropdownMenuShortcut>
                            {shortcut("exit")}
                        </DropdownMenuShortcut>
                    </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                {/* ヘルプ グループ */}
                <DropdownMenuLabel>
                    {t("render.menu.group_help")}
                </DropdownMenuLabel>
                <DropdownMenuGroup>
                    <DropdownMenuItem
                        onClick={openUserGuide}
                        data-testid="main.menu.item.help-manual"
                    >
                        <BookOpen className="mr-2 h-4 w-4" />
                        {t("render.menu.help_manual")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={openAboutDialog}
                        data-testid="main.menu.item.about"
                    >
                        <Info className="mr-2 h-4 w-4" />
                        {t("render.menu.about")}
                    </DropdownMenuItem>
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
