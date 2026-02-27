import {
    Camera,
    ClipboardPaste,
    Maximize2,
    Save,
    Settings2,
} from "lucide-react";

import {
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuShortcut,
} from "@/renderer/components/ui/dropdown-menu";

import type { MainWindowActions } from "../../hooks/useMainWindowActions";
import type { ShortcutLabel, Translate } from "./menuTypes";

interface ImageMenuSectionProps {
    t: Translate;
    shortcut: ShortcutLabel;
    fitToScreen: () => void;
    pasteImage: () => Promise<void>;
    openImageExportDialog: () => void;
    mainWindowActions: MainWindowActions;
}

export function ImageMenuSection({
    t,
    shortcut,
    fitToScreen,
    pasteImage,
    openImageExportDialog,
    mainWindowActions,
}: ImageMenuSectionProps) {
    return (
        <>
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
        </>
    );
}
