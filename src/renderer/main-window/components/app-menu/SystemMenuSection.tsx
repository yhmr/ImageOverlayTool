import { FileDown, LogOut, Settings } from "lucide-react";

import {
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuShortcut,
} from "@/renderer/components/ui/dropdown-menu";

import type { ShortcutLabel, Translate } from "./menuTypes";

interface SystemMenuSectionProps {
    t: Translate;
    shortcut: ShortcutLabel;
    openSettingDialog: () => void;
    onExportLogs: () => void;
    closeWindow: () => void;
}

export function SystemMenuSection({
    t,
    shortcut,
    openSettingDialog,
    onExportLogs,
    closeWindow,
}: SystemMenuSectionProps) {
    return (
        <>
            <DropdownMenuLabel>
                {t("render.menu.group_system")}
            </DropdownMenuLabel>
            <DropdownMenuGroup>
                <DropdownMenuItem
                    onClick={openSettingDialog}
                    data-testid="main.menu.item.settings"
                >
                    <Settings className="mr-2 h-4 w-4" />
                    {t("render.menu.settings")}
                    <DropdownMenuShortcut>
                        {shortcut("openSettings")}
                    </DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={onExportLogs}
                    data-testid="main.menu.item.export-logs"
                >
                    <FileDown className="mr-2 h-4 w-4" />
                    {t("render.menu.export_logs")}
                    <DropdownMenuShortcut>
                        {shortcut("exportLogs")}
                    </DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={closeWindow}
                    data-testid="main.menu.item.exit"
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    {t("render.menu.exit")}
                    <DropdownMenuShortcut>
                        {shortcut("exit")}
                    </DropdownMenuShortcut>
                </DropdownMenuItem>
            </DropdownMenuGroup>
        </>
    );
}
