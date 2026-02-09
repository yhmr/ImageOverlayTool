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
    ImagePlus,
    Info,
} from "lucide-react";

import { getIPCService } from "../../services/ipcService";

interface AppMenuProps {
    handleSettingDlgOpen: () => void;
    handleAboutDlgOpen: () => void;
    handleCloseWindow: () => void;
    handleNewProject: () => void;
    handleOpenProject: () => void;
    handleSaveProject: () => void;
    handleSaveProjectAs: () => void;
}

export function AppMenu(props: AppMenuProps) {
    const {
        handleSettingDlgOpen,
        handleAboutDlgOpen,
        handleCloseWindow,
        handleNewProject,
        handleOpenProject,
        handleSaveProject,
        handleSaveProjectAs,
    } = props;

    const { t } = useTranslation();

    // 画像設定ウィンドウを開く
    const handleOpenImageSettings = async () => {
        const ipcService = getIPCService();
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
                    onClick={handleNewProject}
                    data-testid="main.menu.item.new-project"
                >
                    {t("render.menu.new_project")}
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={handleOpenProject}
                    data-testid="main.menu.item.open-project"
                >
                    {t("render.menu.open_project")}
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={handleSaveProject}
                    data-testid="main.menu.item.save-project"
                >
                    {t("render.menu.save_project")}
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={handleSaveProjectAs}
                    data-testid="main.menu.item.save-project-as"
                >
                    {t("render.menu.save_project_as")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={handleOpenImageSettings}
                    data-testid="main.menu.item.open-image-settings"
                >
                    <ImagePlus className="mr-2 h-4 w-4" />
                    {t("render.menu.load_image")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={handleSettingDlgOpen}
                    data-testid="main.menu.item.settings"
                >
                    <Settings className="mr-2 h-4 w-4" />
                    {t("render.menu.settings")}
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={handleAboutDlgOpen}
                    data-testid="main.menu.item.about"
                >
                    <Info className="mr-2 h-4 w-4" />
                    {t("render.menu.about")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={handleCloseWindow}
                    data-testid="main.menu.item.exit"
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    {t("render.menu.exit")}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
