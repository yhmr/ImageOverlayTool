import { memo, useCallback, useState } from "react";
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

export const ContextMenu = memo(function ContextMenu(props: ContextMenuProps) {
    const { color, setColor, onComplete, children } = props;

    const { t } = useTranslation();

    // カラーピッカー
    const [openColorPicker, setOpenColorPicker] = useState<boolean>(false);
    const [colorPickerPosition, setColorPickerPosition] = useState<Point>({
        x: 0,
        y: 0,
    });

    // カラーピッカーを開く処理
    // ContextMenuのイベントからは正確なマウスポインタ位置が取れない場合があるので
    // クリック時のイベントを利用するか、あるいはContextMenuTriggerのonContextMenuで位置を保存するか
    // ここではContextMenuItemのonSelectでイベントから位置を取得を試みる
    const handleColorPicker = useCallback(() => {
        // CustomEventのdetailにoriginalEventが入ってる可能性があるが、Radixの実装依存
        // 安全策として、ウィンドウ中央または以前のロジックに近い形にする
        // ここでは簡易的にマウス位置を取得できないため、別途Global Mouse Positionをトラックするか
        // あるいはTrigger時に位置を保存する

        // RadixのContextMenuは位置情報を提供しないため、
        // ユーザー体験として、カラーピッカーはダイアログで出すか、固定位置に出すのが無難
        // しかし既存機能維持のため、マウス位置付近に出したい。

        // 妥協案: 現在のマウス位置を取得 (これはReact外でやる必要があるが、ここではクリックイベントがない)
        // 実はContextMenuItemのonSelectは (event) => void で、eventは合成イベントではない。

        // workaround: TriggerのonContextMenuで位置を保存する
        setOpenColorPicker(true);
    }, []);

    const handleContextMenuOpen = useCallback((event: React.MouseEvent) => {
        setColorPickerPosition({ x: event.clientX, y: event.clientY });
    }, []);

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
});
