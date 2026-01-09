import React, { memo, useCallback, useState } from "react";

import { useTranslation } from "react-i18next";
import { Menu, MenuItem } from "@mui/material";

import type { Point } from "../types/ImageSet";
import { ColorPicker } from "./ColorPicker";

interface ContextMenuProps {
  color: string;
  setColor: React.Dispatch<React.SetStateAction<string>>;
  onComplete: () => void;
  children: React.ReactNode;
}

export const ContextMenu = memo(function ContextMenu(props: ContextMenuProps) {
  const { color, setColor, onComplete, children } = props;

  const { t } = useTranslation();

  // コンテキストメニューの操作
  const [contextMenu, setContextMenu] = React.useState<Point | null>(null);
  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    setContextMenu(
      contextMenu === null
        ? {
            x: event.clientX + 2,
            y: event.clientY - 6,
          }
        : null
    );
  };
  const handleClose = useCallback(() => {
    setContextMenu(null);
  }, []);

  // カラーピッカー
  const [openColorPicker, setOpenColorPicker] = useState<boolean>(false);
  const [colorPickerPosition, setColorPickerPosition] = useState<Point>({
    x: 0,
    y: 0,
  });
  const handleColorPicker = useCallback(() => {
    if (contextMenu !== null) {
      setColorPickerPosition(contextMenu);
      setOpenColorPicker(true);
      setContextMenu(null);
    }
  }, [contextMenu]);

  return (
    <div onContextMenu={handleContextMenu} style={{ cursor: "context-menu" }}>
      {children}
      <Menu
        open={contextMenu !== null}
        onClose={handleClose}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.y, left: contextMenu.x }
            : undefined
        }
      >
        <MenuItem onClick={handleColorPicker}>
          {t("render.context_menu.color_picker")}
        </MenuItem>
      </Menu>

      <ColorPicker
        open={openColorPicker}
        setOpen={setOpenColorPicker}
        color={color}
        setColor={setColor}
        onComplete={onComplete}
        position={colorPickerPosition}
      />
    </div>
  );
});
