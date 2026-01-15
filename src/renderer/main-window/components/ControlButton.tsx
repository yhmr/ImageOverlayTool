import { memo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Settings2, Scaling } from "lucide-react";
import { Button } from "@/renderer/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/renderer/components/ui/tooltip";
import { cn } from "@/renderer/lib/utils";

interface ControlButtonProps {
    isDimensionMode: boolean;
    onToggleDimensionMode: () => void;
}

export const ControlButton = memo(function ControlButton(
    props: ControlButtonProps
) {
    const { isDimensionMode, onToggleDimensionMode } = props;
    const { t } = useTranslation();

    // 画像設定ウィンドウを開く
    const handleOpenImageSettings = useCallback(async () => {
        await window.electronAPI.toggleImageSettingsWindow();
    }, []);

    return (
        <TooltipProvider>
            <div className="contents">
                {/* 画像設定ウィンドウを開くボタン */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="secondary"
                            onClick={handleOpenImageSettings}
                            className="absolute bottom-9 right-20 h-12 w-12 rounded-full shadow-lg bg-background/80 hover:bg-background/90 backdrop-blur-sm"
                        >
                            <Settings2 className="h-6 w-6" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                        <p>
                            {t(
                                "render.control_button.tooltip.image_settings",
                                "画像設定 (Ctrl+I)"
                            )}
                        </p>
                    </TooltipContent>
                </Tooltip>

                {/* 矢印記述ボタン */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="secondary"
                            onClick={onToggleDimensionMode}
                            className={cn(
                                "absolute bottom-9 right-4 h-12 w-12 rounded-full shadow-lg backdrop-blur-sm transition-colors",
                                isDimensionMode
                                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                    : "bg-background/80 hover:bg-background/90"
                            )}
                        >
                            <Scaling className="h-6 w-6" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                        <p>
                            {t("render.control_button.tooltip.dimension_line")}
                        </p>
                    </TooltipContent>
                </Tooltip>
            </div>
        </TooltipProvider>
    );
});
