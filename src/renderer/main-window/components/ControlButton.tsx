import { useTranslation } from "react-i18next";
import { Settings2, Scaling, Camera, Save } from "lucide-react";

import { Button } from "@/renderer/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/renderer/components/ui/tooltip";
import { cn } from "@/renderer/lib/utils";
import { useCapture } from "../../hooks/useCapture";
import { useIpcService } from "../../providers/IpcServiceProvider";
import { useAppStore } from "../../store/useAppStore";

interface ControlButtonProps {
    isDimensionMode: boolean;
    onToggleDimensionMode: () => void;
    onOpenExportDialog: () => void;
}

export function ControlButton(props: ControlButtonProps) {
    const { isDimensionMode, onToggleDimensionMode, onOpenExportDialog } =
        props;
    const { t } = useTranslation();
    const { handleCapture } = useCapture();
    const { isUIHidden } = useAppStore();
    const ipcService = useIpcService();

    // 画像設定ウィンドウを開く
    const handleOpenImageSettings = async () => {
        await ipcService.toggleImageSettingsWindow();
    };

    if (isUIHidden) return null;

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
                            data-testid="main.fab.open-image-settings"
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
                            data-testid="main.fab.capture"
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

                {/* 保存ボタン */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="secondary"
                            onClick={onOpenExportDialog}
                            className="absolute bottom-9 right-52 h-12 w-12 rounded-full shadow-lg bg-background/80 hover:bg-background/90 backdrop-blur-sm"
                            data-testid="main.fab.export"
                        >
                            <Save className="h-6 w-6" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                        <p>
                            {t(
                                "render.control_button.tooltip.save",
                                "画像を保存"
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
                            data-testid="main.fab.dimension"
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
