import { BookOpen, Info } from "lucide-react";

import {
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
} from "@/renderer/components/ui/dropdown-menu";

import type { Translate } from "./menuTypes";

interface HelpMenuSectionProps {
    t: Translate;
    openUserGuide: () => void;
    openAboutDialog: () => void;
}

export function HelpMenuSection({
    t,
    openUserGuide,
    openAboutDialog,
}: HelpMenuSectionProps) {
    return (
        <>
            <DropdownMenuLabel>{t("render.menu.group_help")}</DropdownMenuLabel>
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
        </>
    );
}
