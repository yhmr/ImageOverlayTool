import { useTranslation } from "react-i18next";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/renderer/components/ui/dropdown-menu";
import { Button } from "@/renderer/components/ui/button";
import { Menu as MenuIcon, Settings, LogOut, ImagePlus } from "lucide-react";

interface AppMenuProps {
    handleSettingDlgOpen: () => void;
    handleCloseWindow: () => void;
    handleNewProject: () => void;
    handleOpenProject: () => void;
    handleSaveProject: () => void;
    handleSaveProjectAs: () => void;
}

export function AppMenu(props: AppMenuProps) {
    const {
        handleSettingDlgOpen,
        handleCloseWindow,
        handleNewProject,
        handleOpenProject,
        handleSaveProject,
        handleSaveProjectAs,
    } = props;

    const { t } = useTranslation();

    // 画像設定ウィンドウを開く
    const handleOpenImageSettings = async () => {
        await window.electronAPI.toggleImageSettingsWindow();
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="app-region-no-drag"
                >
                    <MenuIcon className="h-6 w-6" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" sideOffset={5}>
                <DropdownMenuItem onClick={handleNewProject}>
                    {t("render.menu.new_project")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleOpenProject}>
                    {t("render.menu.open_project")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSaveProject}>
                    {t("render.menu.save_project")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSaveProjectAs}>
                    {t("render.menu.save_project_as")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleOpenImageSettings}>
                    <ImagePlus className="mr-2 h-4 w-4" />
                    {t("render.menu.load_image")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSettingDlgOpen}>
                    <Settings className="mr-2 h-4 w-4" />
                    {t("render.menu.settings")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCloseWindow}>
                    <LogOut className="mr-2 h-4 w-4" />
                    {t("render.menu.exit")}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
