import { useTranslation } from "react-i18next";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/renderer/components/ui/dropdown-menu";
import { Button } from "@/renderer/components/ui/button";
import {
    Menu as MenuIcon,
    Settings,
    LogOut,
    Settings2,
    Info,
    FilePlus,
    FolderOpen,
    Save,
    SaveAll,
} from "lucide-react";

import { useIpcService } from "../../providers/IpcServiceProvider";

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

    // 画像設定ウィンドウを開く
    const openImageSettings = async () => {
        await ipcService.toggleImageSettingsWindow();
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
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={openImageSettings}
                    data-testid="main.menu.item.open-image-settings"
                >
                    <Settings2 className="mr-2 h-4 w-4" />
                    {t("render.menu.load_image")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={openSettingDialog}
                    data-testid="main.menu.item.settings"
                >
                    <Settings className="mr-2 h-4 w-4" />
                    {t("render.menu.settings")}
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={openAboutDialog}
                    data-testid="main.menu.item.about"
                >
                    <Info className="mr-2 h-4 w-4" />
                    {t("render.menu.about")}
                </DropdownMenuItem>
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
