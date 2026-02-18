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
} from "lucide-react";

import { useIpcService } from "../../providers/IpcServiceProvider";
import { useFitToScreen } from "../../hooks/useFitToScreen";
import { useImagePaste } from "../../hooks/useImagePaste";

interface AppMenuProps {
    openSettingDialog: () => void;
    openAboutDialog: () => void;
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

    // 画像設定ウィンドウを開く
    const openImageSettings = async () => {
        await ipcService.toggleImageSettingsWindow();
    };

    const exportLogs = async () => {
        await ipcService.log.export();
    };

    const openManual = () => {
        window.open("https://yhmr.github.io/ImageOverlayTool/guide/", "_blank");
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="app-region-no-drag"
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
                        onClick={openImageSettings}
                        data-testid="main.menu.item.open-image-settings"
                    >
                        <Settings2 className="mr-2 h-4 w-4" />
                        {t("render.menu.load_image")}
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
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                {/* アプリケーション グループ */}
                <DropdownMenuLabel>
                    {t("render.menu.group_app")}
                </DropdownMenuLabel>
                <DropdownMenuGroup>
                    <DropdownMenuItem
                        onClick={openSettingDialog}
                        data-testid="main.menu.item.settings"
                    >
                        <Settings className="mr-2 h-4 w-4" />
                        {t("render.menu.settings")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={openManual}
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
    );
}
