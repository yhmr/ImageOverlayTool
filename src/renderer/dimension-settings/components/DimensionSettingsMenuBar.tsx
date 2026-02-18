import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/renderer/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/renderer/components/ui/tooltip";
import { useIpcService } from "@/renderer/providers/IpcServiceProvider";

export function DimensionSettingsMenuBar() {
    const { t } = useTranslation();
    const ipcService = useIpcService();

    const closeWindow = async () => {
        await ipcService.toggleDimensionSettingsWindow();
    };

    return (
        <TooltipProvider>
            <div
                className="flex shrink-0 items-center justify-between min-h-[40px] px-2 bg-background border-b app-region-drag select-none text-foreground"
                data-testid="dimension-settings.menu.bar"
            >
                <div className="flex-grow text-sm font-medium">
                    {t("render.dimension_line_settings.title")}
                </div>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={closeWindow}
                            className="h-8 w-8 app-region-no-drag hover:bg-destructive hover:text-destructive-foreground"
                            data-testid="dimension-settings.menu.close"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{t("common.close")}</p>
                    </TooltipContent>
                </Tooltip>
            </div>
        </TooltipProvider>
    );
}
