import { Droplets, Ghost, Pin, Square } from "lucide-react";

import {
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuShortcut,
} from "@/renderer/components/ui/dropdown-menu";

import type { MainWindowActions } from "../../hooks/useMainWindowActions";
import type { ShortcutLabel, Translate } from "./menuTypes";

interface ViewMenuSectionProps {
    t: Translate;
    shortcut: ShortcutLabel;
    onOpenWindowColorPicker: () => void;
    mainWindowActions: MainWindowActions;
}

export function ViewMenuSection({
    t,
    shortcut,
    onOpenWindowColorPicker,
    mainWindowActions,
}: ViewMenuSectionProps) {
    return (
        <>
            <DropdownMenuLabel>{t("render.menu.group_view")}</DropdownMenuLabel>
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
        </>
    );
}
