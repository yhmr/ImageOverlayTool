import React, { memo, useCallback } from "react";

import { HexAlphaColorPicker } from "react-colorful";


import type { Point } from "../../shared/types/Point";

interface ColorPickerProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  color: string;
  setColor: (color: string) => void;
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

  if (!position) {
    return null;
  }

  return (
    <>
      {open && (
        <div
          style={{
            position: "absolute",
            top: position.y + "px",
            left: position.x + "px",
            zIndex: 1300, // MUI Menu uses high z-index, ensure this is visible or properly layered
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
            onClick={handleOnClickBackground}
          ></div>
          <div style={{ position: "relative", zIndex: 1301 }}>
            <HexAlphaColorPicker color={color} onChange={setColor} />
          </div>
        </div>
      )}
    </>
  );
});
