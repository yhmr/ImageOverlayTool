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
    setColor: (color: string) => void;
    onComplete: () => void;
    children: React.ReactNode;
}

export function ContextMenu(props: ContextMenuProps) {
    const { color, setColor, onComplete, children } = props;

    const { t } = useTranslation();

    // カラーピッカー
    const [openColorPicker, setOpenColorPicker] = useState<boolean>(false);
    const [colorPickerPosition, setColorPickerPosition] = useState<Point>({
        x: 0,
        y: 0,
    });

    // カラーピッカーを開く処理
    const handleColorPicker = () => {
        setOpenColorPicker(true);
    };

    const handleContextMenuOpen = (event: React.MouseEvent) => {
        setColorPickerPosition({ x: event.clientX, y: event.clientY });
    };

    return (
        <ShadcnContextMenu>
            <ContextMenuTrigger onContextMenu={handleContextMenuOpen}>
                <div style={{ cursor: "context-menu" }}>{children}</div>
            </ContextMenuTrigger>
            <ContextMenuContent>
                <ContextMenuItem onSelect={handleColorPicker}>
                    {t("render.context_menu.color_picker")}
                </ContextMenuItem>
            </ContextMenuContent>

            <ColorPicker
                open={openColorPicker}
                setOpen={setOpenColorPicker}
                color={color}
                setColor={setColor}
                onComplete={onComplete}
                position={colorPickerPosition}
            />
        </ShadcnContextMenu>
    );
}
