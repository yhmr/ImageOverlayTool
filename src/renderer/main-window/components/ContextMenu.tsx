import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ContextMenu as ShadcnContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "@/renderer/components/ui/context-menu";

import type { Point } from "../../../shared/types/Point";
import { ColorPicker } from "./ColorPicker";

interface ContextMenuProps {
    color: string;
    onColorChange: (color: string) => void;
    onColorChangeComplete: () => void;
    children: React.ReactNode;
}

export function ContextMenu(props: ContextMenuProps) {
    const { color, onColorChange, onColorChangeComplete, children } = props;

    const { t } = useTranslation();

    // カラーピッカー
    const [isColorPickerOpen, setIsColorPickerOpen] = useState<boolean>(false);
    const [colorPickerPosition, setColorPickerPosition] = useState<Point>({
        x: 0,
        y: 0,
    });

    // カラーピッカーを開く処理
    const openColorPicker = () => {
        setIsColorPickerOpen(true);
    };

    const updateColorPickerPosition = (event: React.MouseEvent) => {
        setColorPickerPosition({ x: event.clientX, y: event.clientY });
    };

    return (
        <ShadcnContextMenu>
            <ContextMenuTrigger onContextMenu={updateColorPickerPosition}>
                <div style={{ cursor: "context-menu" }}>{children}</div>
            </ContextMenuTrigger>
            <ContextMenuContent>
                <ContextMenuItem onSelect={openColorPicker}>
                    {t("render.context_menu.color_picker")}
                </ContextMenuItem>
            </ContextMenuContent>

            <ColorPicker
                isOpen={isColorPickerOpen}
                onOpenChange={setIsColorPickerOpen}
                color={color}
                onColorChange={onColorChange}
                onColorChangeComplete={onColorChangeComplete}
                position={colorPickerPosition}
            />
        </ShadcnContextMenu>
    );
}
