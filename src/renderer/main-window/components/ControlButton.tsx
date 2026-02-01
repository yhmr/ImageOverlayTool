import { useTranslation } from "react-i18next";
import { Settings2, Scaling, Camera } from "lucide-react";
import { Button } from "@/renderer/components/ui/button";
import { useCapture } from "../../hooks/useCapture";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/renderer/components/ui/tooltip";
import { getIPCService } from "../../services/ipcService";
import { cn } from "@/renderer/lib/utils";

interface ControlButtonProps {
    isDimensionMode: boolean;
    onToggleDimensionMode: () => void;
}

export function ControlButton(props: ControlButtonProps) {
    const { isDimensionMode, onToggleDimensionMode } = props;
    const { t } = useTranslation();
    const { handleCapture } = useCapture();

    // 画像設定ウィンドウを開く
    const handleOpenImageSettings = async () => {
        const ipcService = getIPCService();
        await ipcService.toggleImageSettingsWindow();
    };

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

                {/* 背景キャプチャボタン */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="secondary"
                            onClick={handleCapture}
                            className="absolute bottom-9 right-36 h-12 w-12 rounded-full shadow-lg bg-background/80 hover:bg-background/90 backdrop-blur-sm"
                        >
                            <Camera className="h-6 w-6" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                        <p>
                            {t(
                                "render.control_button.tooltip.capture",
                                "背景をキャプチャ"
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
}
