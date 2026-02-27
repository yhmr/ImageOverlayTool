import { Ruler } from "lucide-react";

import {
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuShortcut,
} from "@/renderer/components/ui/dropdown-menu";

import type { ShortcutLabel, Translate } from "./menuTypes";

interface DimensionMenuSectionProps {
    t: Translate;
    shortcut: ShortcutLabel;
    openDimensionSettingsWindow: () => void;
}

export function DimensionMenuSection({
    t,
    shortcut,
    openDimensionSettingsWindow,
}: DimensionMenuSectionProps) {
    return (
        <>
            <DropdownMenuLabel>
                {t("render.menu.group_dimension")}
            </DropdownMenuLabel>
            <DropdownMenuGroup>
                <DropdownMenuItem
                    onClick={openDimensionSettingsWindow}
                    data-testid="main.menu.item.open-dimension-settings"
                >
                    <Ruler className="mr-2 h-4 w-4" />
                    {t("render.menu.open_dimension_settings")}
                    <DropdownMenuShortcut>
                        {shortcut("openDimensionSettings")}
                    </DropdownMenuShortcut>
                </DropdownMenuItem>
            </DropdownMenuGroup>
        </>
    );
}
