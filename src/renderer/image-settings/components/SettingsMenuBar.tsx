import { X, Camera } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/renderer/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/renderer/components/ui/tooltip";
import { useCapture } from "../../hooks/useCapture";
import { useIpcService } from "../../providers/IpcServiceProvider";

/**
 * 画像設定ウィンドウ用のシンプルなタイトルバー
 */
export function SettingsMenuBar() {
    const { t } = useTranslation();
    const { captureBackground } = useCapture();
    const ipcService = useIpcService();

    // ウィンドウを非表示にする（トグル動作）
    const closeSettingsWindow = async () => {
        await ipcService.toggleImageSettingsWindow();
    };

    return (
        <TooltipProvider>
            <div
                className="flex shrink-0 items-center justify-between min-h-[40px] px-2 bg-background border-b app-region-drag select-none text-foreground"
                data-testid="settings.menu.bar"
            >
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
                            onClick={captureBackground}
                            className="h-8 w-8 app-region-no-drag hover:bg-accent hover:text-accent-foreground mr-1"
                            data-testid="settings.menu.capture"
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
                            onClick={closeSettingsWindow}
                            className="h-8 w-8 app-region-no-drag hover:bg-destructive hover:text-destructive-foreground"
                            data-testid="settings.menu.close"
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
