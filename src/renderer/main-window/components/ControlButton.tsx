import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Settings2,
    Ruler,
    Camera,
    Save,
    Droplets,
    Ghost,
    Plus,
    X,
} from "lucide-react";

import { Button } from "@/renderer/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/renderer/components/ui/tooltip";
import { cn } from "@/renderer/lib/utils";
import { useAppStore } from "../../store/useAppStore";
import type { MainWindowActions } from "../hooks/useMainWindowActions";

interface ControlButtonProps {
    onOpenImageExportDialog: () => void;
    onOpenWindowColorPicker: () => void;
    mainWindowActions: MainWindowActions;
}

export function ControlButton(props: ControlButtonProps) {
    const {
        onOpenImageExportDialog,
        onOpenWindowColorPicker,
        mainWindowActions,
    } = props;
    const { t } = useTranslation();
    const isUIHidden = useAppStore((state) => state.isUIHidden);
    const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);

    const toggleFabMenu = () => setIsFabMenuOpen((prev) => !prev);

    if (isUIHidden) return null;

    // ボタンの定義
    const menuItems = [
        // Group A: 表示・設定系
        {
            id: "dimension-settings",
            icon: Ruler,
            label: t("render.control_button.tooltip.dimension_line"),
            onClick: mainWindowActions.openDimensionSettingsWindow,
        },
        {
            id: "image-settings",
            icon: Settings2,
            label: t("render.control_button.tooltip.image_settings"),
            onClick: mainWindowActions.openImageSettingsWindow,
        },
        {
            id: "background-style",
            icon: Droplets,
            label: t("render.control_button.tooltip.background_style"),
            onClick: onOpenWindowColorPicker,
        },
        {
            id: "click-through-mode",
            icon: Ghost,
            label: t("render.control_button.tooltip.click_through_mode"),
            onClick: mainWindowActions.toggleClickThroughMode,
            isActive: mainWindowActions.isClickThroughMode,
            activeClass:
                "bg-primary text-primary-foreground hover:bg-primary/90",
        },
        // Group B: アクション・保存系
        {
            id: "capture",
            icon: Camera,
            label: t("render.control_button.tooltip.capture"),
            onClick: mainWindowActions.captureBackground,
            separatorBefore: true, // 区切り線用フラグ
        },
        {
            id: "export",
            icon: Save,
            label: t("render.control_button.tooltip.save"),
            onClick: onOpenImageExportDialog,
        },
    ];

    return (
        <TooltipProvider>
            <div className="contents" data-clickthrough-allow>
                {/* メニュー展開ボタン */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="secondary"
                            onClick={toggleFabMenu}
                            className={cn(
                                "absolute bottom-9 right-4 h-12 w-12 rounded-full shadow-lg transition-all duration-300 z-50",
                                isFabMenuOpen
                                    ? "bg-muted rotate-90"
                                    : "bg-background/80 hover:bg-background/90 backdrop-blur-sm"
                            )}
                            data-testid="main.fab.menu-toggle"
                            data-clickthrough-allow
                        >
                            {isFabMenuOpen ? (
                                <X className="h-6 w-6" />
                            ) : (
                                <Plus className="h-6 w-6" />
                            )}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                        <p>
                            {isFabMenuOpen
                                ? t("common.close")
                                : t("common.menu")}
                        </p>
                    </TooltipContent>
                </Tooltip>

                {/* 展開されるボタン群 */}
                {menuItems.map((item, index) => {
                    // 展開時の位置計算: 右から順に並べる
                    // ベース位置: right-4 (16px) + ボタン幅(48px) + マージン(16px) = 80px start
                    // index 0: right-20 (80px)
                    // index 1: right-36 (144px)
                    // ...
                    const rightPos = 20 + index * 16; // tailwind spacing unit (4px) -> 20 * 4 = 80px, 16 * 4 = 64px spacing

                    return (
                        <div
                            key={item.id}
                            className={cn(
                                "absolute bottom-9 transition-all duration-300 ease-out flex items-center justify-center z-50", // justify-centerを追加
                                isFabMenuOpen
                                    ? "opacity-100 scale-100 translate-x-0"
                                    : "opacity-0 scale-75 translate-x-12 pointer-events-none"
                            )}
                            style={{
                                right: `${rightPos * 0.25}rem`,
                                transitionDelay: isFabMenuOpen
                                    ? `${index * 50}ms`
                                    : "0ms",
                            }}
                        >
                            {/* セパレーター: ボタンの右側に配置 (表示順序の都合上、前のアイテムとの境界線にするため) */}
                            {item.separatorBefore && (
                                <div className="absolute -right-2 top-1/2 -translate-y-1/2 h-8 w-px bg-white/20" />
                            )}

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="secondary"
                                        onClick={() => {
                                            item.onClick();
                                            // アクション系の場合はメニューを閉じる？
                                            // 今回は使い勝手を考慮して閉じない、またはユーザーの好みによるが
                                            // モード切替などは閉じない方が良い。
                                        }}
                                        className={cn(
                                            "h-12 w-12 rounded-full shadow-lg bg-background/80 hover:bg-background/90 backdrop-blur-sm",
                                            item.isActive && item.activeClass
                                        )}
                                        data-testid={`main.fab.${item.id}`}
                                        data-clickthrough-allow
                                    >
                                        <item.icon className="h-6 w-6" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top">
                                    <p>{item.label}</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    );
                })}
            </div>
        </TooltipProvider>
    );
}
