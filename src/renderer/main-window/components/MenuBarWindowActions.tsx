import { useTranslation } from "react-i18next";
import { Maximize, Minimize, Minus, X } from "lucide-react";

import { Button } from "@/renderer/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/renderer/components/ui/tooltip";

interface MenuBarWindowActionsProps {
    isMaximized: boolean;
    onMinimizeWindow: () => void;
    onToggleMaximized: () => void;
    onCloseWindow: () => void;
}

export function MenuBarWindowActions({
    isMaximized,
    onMinimizeWindow,
    onToggleMaximized,
    onCloseWindow,
}: MenuBarWindowActionsProps) {
    const { t } = useTranslation();

    return (
        <>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onMinimizeWindow}
                        className="app-region-no-drag"
                        data-testid="main.action.window-minimize"
                    >
                        <Minus className="h-6 w-6" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{t("render.menu_button.tooltip.minimize")}</p>
                </TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onToggleMaximized}
                        className="app-region-no-drag"
                        data-testid="main.action.window-toggle"
                    >
                        {isMaximized ? (
                            <Minimize className="h-6 w-6" />
                        ) : (
                            <Maximize className="h-6 w-6" />
                        )}
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>
                        {isMaximized
                            ? t("render.menu_button.tooltip.unmaximize")
                            : t("render.menu_button.tooltip.maximize")}
                    </p>
                </TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onCloseWindow}
                        className="app-region-no-drag hover:bg-destructive hover:text-destructive-foreground"
                        data-testid="main.action.window-close"
                    >
                        <X className="h-6 w-6" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{t("render.menu_button.tooltip.close")}</p>
                </TooltipContent>
            </Tooltip>
        </>
    );
}
