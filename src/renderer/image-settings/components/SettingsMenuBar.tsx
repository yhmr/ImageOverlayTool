import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { Button } from "@/renderer/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/renderer/components/ui/tooltip";

/**
 * 画像設定ウィンドウ用のシンプルなタイトルバー
 * タイトルと閉じるボタン（トグル動作）のみ
 */
export function SettingsMenuBar() {
    const { t } = useTranslation();

    // ウィンドウを非表示にする（トグル動作）
    const handleClose = async () => {
        await window.electronAPI.toggleImageSettingsWindow();
    };

    return (
        <TooltipProvider>
            <div className="flex shrink-0 items-center justify-between min-h-[40px] px-2 bg-background border-b app-region-drag select-none text-foreground">
                {/* タイトル */}
                <div className="flex-grow text-sm font-medium">
                    {t("render.image_settings.title", "画像設定")}
                </div>

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
                        <p>
                            {t("render.image_settings.tooltip.close", "閉じる")}
                        </p>
                    </TooltipContent>
                </Tooltip>
            </div>
        </TooltipProvider>
    );
}
