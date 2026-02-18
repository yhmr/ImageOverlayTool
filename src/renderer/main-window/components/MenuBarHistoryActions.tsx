import { useTranslation } from "react-i18next";
import { Redo, Undo } from "lucide-react";

import { Button } from "@/renderer/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/renderer/components/ui/tooltip";

interface MenuBarHistoryActionsProps {
    canUndo: boolean;
    canRedo: boolean;
    onUndo: () => void;
    onRedo: () => void;
}

export function MenuBarHistoryActions({
    canUndo,
    canRedo,
    onUndo,
    onRedo,
}: MenuBarHistoryActionsProps) {
    const { t } = useTranslation();

    return (
        <div className="flex items-center gap-1 app-region-no-drag">
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onUndo}
                        disabled={!canUndo}
                        className="h-8 w-8"
                        data-testid="main.action.undo"
                    >
                        <Undo className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{t("common.undo")}</p>
                </TooltipContent>
            </Tooltip>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onRedo}
                        disabled={!canRedo}
                        className="h-8 w-8"
                        data-testid="main.action.redo"
                    >
                        <Redo className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{t("common.redo")}</p>
                </TooltipContent>
            </Tooltip>
        </div>
    );
}
