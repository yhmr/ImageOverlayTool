import { useState } from "react";
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
} from "lucide-react";

import { useIpcService } from "../../providers/IpcServiceProvider";
import { useFitToScreen } from "../../hooks/useFitToScreen";
import { useImagePaste } from "../../hooks/useImagePaste";
import { useCapture } from "../../hooks/useCapture";
import { useAppStore } from "../../store/useAppStore";
import { ColorPicker } from "./ColorPicker";

interface AppMenuProps {
    openSettingDialog: () => void;
    openAboutDialog: () => void;
    openImageExportDialog: () => void;
    closeWindow: () => void;
    newProject: () => void;
    openProject: () => void;
    saveProject: () => void;
    saveProjectAs: () => void;
}

export function AppMenu(props: AppMenuProps) {
    const {
        openSettingDialog,
        openAboutDialog,
        openImageExportDialog,
        closeWindow,
        newProject,
        openProject,
        saveProject,
        saveProjectAs,
    } = props;

    const { t } = useTranslation();
    const ipcService = useIpcService();
    const { fitToScreen } = useFitToScreen();
    const { pasteImage } = useImagePaste();
    const { captureBackground } = useCapture();
    const {
        isClickThroughMode,
        setClickThroughMode,
        windowColor,
        setWindowColor,
    } = useAppStore();
    const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

    // 画像設定ウィンドウを開く
    const toggleImageSettingsWindow = async () => {
        await ipcService.toggleImageSettingsWindow();
    };

    const toggleDimensionSettingsWindow = async () => {
        await ipcService.toggleDimensionSettingsWindow();
    };

    const exportLogs = async () => {
        await ipcService.log.export();
    };

    const openWindowColorPicker = () => {
        setIsColorPickerOpen(true);
    };

    const saveWindowColor = () => {
        void ipcService.saveWindowColor(windowColor);
    };

    const changeWindowColor = (color: string) => {
        setWindowColor(color);
    };

    const openUserGuide = () => {
        window.open("https://yhmr.github.io/ImageOverlayTool/guide/", "_blank");
    };

    return (
        <>
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
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={openProject}
                            data-testid="main.menu.item.open-project"
                        >
                            <FolderOpen className="mr-2 h-4 w-4" />
                            {t("render.menu.open_project")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={saveProject}
                            data-testid="main.menu.item.save-project"
                        >
                            <Save className="mr-2 h-4 w-4" />
                            {t("render.menu.save_project")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={saveProjectAs}
                            data-testid="main.menu.item.save-project-as"
                        >
                            <SaveAll className="mr-2 h-4 w-4" />
                            {t("render.menu.save_project_as")}
                        </DropdownMenuItem>
                    </DropdownMenuGroup>

                    <DropdownMenuSeparator />

                    {/* 画像 グループ */}
                    <DropdownMenuLabel>
                        {t("render.menu.group_image")}
                    </DropdownMenuLabel>
                    <DropdownMenuGroup>
                        <DropdownMenuItem
                            onClick={toggleImageSettingsWindow}
                            data-testid="main.menu.item.open-image-settings"
                        >
                            <Settings2 className="mr-2 h-4 w-4" />
                            {t("render.menu.open_image_settings")}
                            <DropdownMenuShortcut>Ctrl+I</DropdownMenuShortcut>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={fitToScreen}
                            data-testid="main.menu.item.fit-screen"
                        >
                            <Maximize2 className="mr-2 h-4 w-4" />
                            {t("render.menu.fit_screen")}
                            <DropdownMenuShortcut>Ctrl+F</DropdownMenuShortcut>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => void pasteImage()}
                            data-testid="main.menu.item.paste-image"
                        >
                            <ClipboardPaste className="mr-2 h-4 w-4" />
                            {t("render.menu.paste_image")}
                            <DropdownMenuShortcut>Ctrl+V</DropdownMenuShortcut>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => void captureBackground()}
                            data-testid="main.menu.item.capture-background"
                        >
                            <Camera className="mr-2 h-4 w-4" />
                            {t("render.menu.capture_background")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={openImageExportDialog}
                            data-testid="main.menu.item.export-image"
                        >
                            <Save className="mr-2 h-4 w-4" />
                            {t("render.menu.export_image")}
                        </DropdownMenuItem>
                    </DropdownMenuGroup>

                    <DropdownMenuSeparator />

                    {/* 寸法線 グループ */}
                    <DropdownMenuLabel>
                        {t("render.menu.group_dimension")}
                    </DropdownMenuLabel>
                    <DropdownMenuGroup>
                        <DropdownMenuItem
                            onClick={toggleDimensionSettingsWindow}
                            data-testid="main.menu.item.open-dimension-settings"
                        >
                            <Ruler className="mr-2 h-4 w-4" />
                            {t("render.menu.open_dimension_settings")}
                            <DropdownMenuShortcut>Ctrl+D</DropdownMenuShortcut>
                        </DropdownMenuItem>
                    </DropdownMenuGroup>

                    <DropdownMenuSeparator />

                    {/* アプリケーション グループ */}
                    <DropdownMenuLabel>
                        {t("render.menu.group_app")}
                    </DropdownMenuLabel>
                    <DropdownMenuGroup>
                        <DropdownMenuItem
                            onClick={openWindowColorPicker}
                            data-testid="main.menu.item.background-style"
                        >
                            <Droplets className="mr-2 h-4 w-4" />
                            {t("render.menu.background_style")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() =>
                                setClickThroughMode(!isClickThroughMode)
                            }
                            data-testid="main.menu.item.click-through-mode"
                        >
                            <Ghost className="mr-2 h-4 w-4" />
                            {isClickThroughMode
                                ? t("render.menu.click_through_mode_disable")
                                : t("render.menu.click_through_mode_enable")}
                            <DropdownMenuShortcut>
                                Ctrl+Shift+M
                            </DropdownMenuShortcut>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={openSettingDialog}
                            data-testid="main.menu.item.settings"
                        >
                            <Settings className="mr-2 h-4 w-4" />
                            {t("render.menu.settings")}
                        </DropdownMenuItem>
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
                        <DropdownMenuItem
                            onClick={exportLogs}
                            data-testid="main.menu.item.export-logs"
                        >
                            <FileDown className="mr-2 h-4 w-4" />
                            {t("render.menu.export_logs")}
                        </DropdownMenuItem>
                    </DropdownMenuGroup>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                        onClick={closeWindow}
                        data-testid="main.menu.item.exit"
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        {t("render.menu.exit")}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <ColorPicker
                isOpen={isColorPickerOpen}
                onOpenChange={setIsColorPickerOpen}
                color={windowColor}
                onColorChange={changeWindowColor}
                onColorChangeComplete={saveWindowColor}
                centerOnScreen
            />
        </>
    );
}
