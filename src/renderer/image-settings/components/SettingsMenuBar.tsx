import { useTranslation } from "react-i18next";
import { X, Camera } from "lucide-react";
import { Button } from "@/renderer/components/ui/button";
import { useCapture } from "../../hooks/useCapture";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/renderer/components/ui/tooltip";
import { getIPCService } from "../../services/ipcService";

/**
 * 画像設定ウィンドウ用のシンプルなタイトルバー
 */
export function SettingsMenuBar() {
    const { t } = useTranslation();
    const { handleCapture } = useCapture();

    // ウィンドウを非表示にする（トグル動作）
    const handleClose = async () => {
        await getIPCService().toggleImageSettingsWindow();
    };

    return (
        <TooltipProvider>
            <div className="flex shrink-0 items-center justify-between min-h-[40px] px-2 bg-background border-b app-region-drag select-none text-foreground">
                {/* タイトル */}
                <div className="flex-grow text-sm font-medium">
                    {t("render.image_settings.title")}
                </div>

                {/* キャプチャボタン */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleCapture}
                            className="h-8 w-8 app-region-no-drag hover:bg-accent hover:text-accent-foreground mr-1"
                        >
                            <Camera className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>
                            {t(
                                "render.image_settings.tooltip.capture",
                                "背景をキャプチャ"
                            )}
                        </p>
                    </TooltipContent>
                </Tooltip>

                {/* 閉じるボタン（トグル動作） */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleClose}
                            className="h-8 w-8 app-region-no-drag hover:bg-destructive hover:text-destructive-foreground"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{t("render.image_settings.tooltip.close")}</p>
                    </TooltipContent>
                </Tooltip>
            </div>
        </TooltipProvider>
    );
}
