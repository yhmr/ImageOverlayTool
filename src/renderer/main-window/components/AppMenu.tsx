import { Menu as MenuIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/renderer/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/renderer/components/ui/dropdown-menu";

import {
    MAIN_WINDOW_SHORTCUT_LABELS,
    type MainWindowShortcutLabelKey,
} from "../hooks/shortcuts/mainWindowShortcuts";
import { useFitToScreen } from "../hooks/useFitToScreen";
import { useImagePaste } from "../hooks/useImagePaste";
import type { MainWindowActions } from "../hooks/useMainWindowActions";
import { DimensionMenuSection } from "./app-menu/DimensionMenuSection";
import { HelpMenuSection } from "./app-menu/HelpMenuSection";
import { ImageMenuSection } from "./app-menu/ImageMenuSection";
import { ProjectMenuSection } from "./app-menu/ProjectMenuSection";
import { SystemMenuSection } from "./app-menu/SystemMenuSection";
import { ViewMenuSection } from "./app-menu/ViewMenuSection";

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

export function AppMenu({
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
}: AppMenuProps) {
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
                <ProjectMenuSection
                    t={t}
                    shortcut={shortcut}
                    newProject={newProject}
                    openProject={openProject}
                    saveProject={saveProject}
                    saveProjectAs={saveProjectAs}
                />
                <DropdownMenuSeparator />
                <ImageMenuSection
                    t={t}
                    shortcut={shortcut}
                    fitToScreen={fitToScreen}
                    pasteImage={pasteImage}
                    openImageExportDialog={openImageExportDialog}
                    mainWindowActions={mainWindowActions}
                />
                <DropdownMenuSeparator />
                <DimensionMenuSection
                    t={t}
                    shortcut={shortcut}
                    openDimensionSettingsWindow={
                        mainWindowActions.openDimensionSettingsWindow
                    }
                />
                <DropdownMenuSeparator />
                <ViewMenuSection
                    t={t}
                    shortcut={shortcut}
                    onOpenWindowColorPicker={onOpenWindowColorPicker}
                    mainWindowActions={mainWindowActions}
                />
                <DropdownMenuSeparator />
                <SystemMenuSection
                    t={t}
                    shortcut={shortcut}
                    openSettingDialog={openSettingDialog}
                    onExportLogs={onExportLogs}
                    closeWindow={closeWindow}
                />
                <DropdownMenuSeparator />
                <HelpMenuSection
                    t={t}
                    openUserGuide={openUserGuide}
                    openAboutDialog={openAboutDialog}
                />
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
