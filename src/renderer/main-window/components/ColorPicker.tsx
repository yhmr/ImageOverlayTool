import React from "react";

import { HexAlphaColorPicker } from "react-colorful";

import type { Point } from "../../../shared/types/Point";

interface ColorPickerProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    color: string;
    onColorChange: (color: string) => void;
    onColorChangeComplete: () => void;
    position: Point;
}

export function ColorPicker(props: ColorPickerProps) {
    const {
        isOpen,
        onOpenChange,
        color,
        onColorChange,
        onColorChangeComplete,
        position,
    } = props;

    // 背景クリックで表示をOFF、かつ終了処理
    const closePicker = () => {
        onOpenChange(false);
        onColorChangeComplete();
    };

    if (!position) {
        return null;
    }

    return (
        <>
            {isOpen && (
                <div
                    style={{
                        position: "absolute",
                        top: position.y + "px",
                        left: position.x + "px",
                        zIndex: 1300,
                    }}
                >
                    {/* 背景クリック用の領域確保 */}
                    <div
                        style={{
                            position: "fixed",
                            width: "100%",
                            height: "100%",
                            top: "0",
                            left: "0",
                            zIndex: 1300,
                        }}
                        onClick={closePicker}
                    ></div>
                    <div style={{ position: "relative", zIndex: 1301 }}>
                        <HexAlphaColorPicker
                            color={color}
                            onChange={onColorChange}
                        />
                    </div>
                </div>
            )}
        </>
    );
}
