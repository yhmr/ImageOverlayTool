import React, { memo, useCallback } from "react";

import { ColorResult, SketchPicker } from "react-color";

import type { Point } from "../types/Point";

interface ColorPickerProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  color: string;
  setColor: React.Dispatch<React.SetStateAction<string>>;
  onComplete: () => void;
  position: Point;
}
export const ColorPicker = memo(function ColorPicker(props: ColorPickerProps) {
  const { open, setOpen, color, setColor, onComplete, position } = props;

  // 背景クリックで表示をOFF、かつ終了処理
  const handleOnClickBackground = useCallback(() => {
    setOpen(false);
    onComplete();
  }, [setOpen, onComplete]);

  const decimalToHex = useCallback(
    (alpha: number) =>
      alpha === 0 ? "00" : Math.round(255 * alpha).toString(16),
    []
  );

  // カラー操作中
  const handleOnChangeColor = useCallback(
    (color: ColorResult) => {
      const hexCode = `${color.hex}${decimalToHex(color.rgb.a || 0)}`;
      setColor(hexCode);
    },
    [setColor, decimalToHex]
  );

  return (
    <>
      {open && (
        <div
          style={{
            position: "absolute",
            top: position?.y + "px",
            left: position?.x + "px",
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
            }}
            onClick={handleOnClickBackground}
          ></div>
          <SketchPicker color={color} onChange={handleOnChangeColor} />
        </div>
      )}
    </>
  );
});
