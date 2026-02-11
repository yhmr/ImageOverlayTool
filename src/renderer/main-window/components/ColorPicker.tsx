import React from "react";

import { HexAlphaColorPicker } from "react-colorful";

import type { Point } from "../../../shared/types/Point";

interface ColorPickerProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    color: string;
    onColorChange: (color: string) => void;
    onColorChangeComplete: () => void;
    position?: Point;
    centerOnScreen?: boolean;
}

export function ColorPicker(props: ColorPickerProps) {
    const {
        isOpen,
        onOpenChange,
        color,
        onColorChange,
        onColorChangeComplete,
        position,
        centerOnScreen = false,
    } = props;

    // 背景クリックで表示をOFF、かつ終了処理
    const closePicker = () => {
        onOpenChange(false);
        onColorChangeComplete();
    };

    if (!isOpen) {
        return null;
    }

    const pickerStyle: React.CSSProperties = centerOnScreen
        ? {
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 1301,
          }
        : {
              position: "fixed",
              top: `${position?.y ?? 0}px`,
              left: `${position?.x ?? 0}px`,
              zIndex: 1301,
          };

    return (
        <>
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
            <div style={pickerStyle}>
                <HexAlphaColorPicker color={color} onChange={onColorChange} />
            </div>
        </>
    );
}
