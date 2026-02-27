import React, { useState } from "react";

import { HexAlphaColorPicker } from "react-colorful";
import { PenLine, Plus, X } from "lucide-react";

import type { Point } from "../../../shared/types/Point";

interface ColorPickerProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    color: string;
    onColorChange: (color: string) => void;
    onColorChangeComplete: () => void;
    position?: Point;
    centerOnScreen?: boolean;
    // --- Swatch feature props ---
    presets?: string[];
    onAddPreset?: (color: string) => void;
    onRemovePreset?: (color: string) => void;
    onUpdatePreset?: (oldColor: string, newColor: string) => void;
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
        presets = [],
        onAddPreset,
        onRemovePreset,
        onUpdatePreset,
    } = props;

    // hovered swatch index for showing remove button
    const [hoveredPresetIndex, setHoveredPresetIndex] = useState<number | null>(
        null
    );
    const [selectedPresetIndex, setSelectedPresetIndex] = useState<
        number | null
    >(null);

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
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              background: "hsl(var(--popover))",
              padding: "12px",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              border: "1px solid hsl(var(--border))",
          }
        : {
              position: "fixed",
              top: `${position?.y ?? 0}px`,
              left: `${position?.x ?? 0}px`,
              zIndex: 1301,
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              background: "hsl(var(--popover))",
              padding: "12px",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              border: "1px solid hsl(var(--border))",
          };

    // Check if current color is already in presets (case insensitive)
    const isCurrentColorInPresets = presets.some(
        (p) => p.toLowerCase() === color.toLowerCase()
    );
    const selectedPresetColor =
        selectedPresetIndex === null
            ? null
            : presets[selectedPresetIndex] ?? null;
    const canUpdateSelectedPreset =
        Boolean(onUpdatePreset) &&
        Boolean(selectedPresetColor) &&
        selectedPresetColor?.toLowerCase() !== color.toLowerCase();

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
                onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        closePicker();
                    }
                }}
                role="button"
                tabIndex={0}
                aria-label="Close color picker"
                data-testid="main.color-picker.overlay"
            ></div>
            <div style={pickerStyle}>
                <HexAlphaColorPicker color={color} onChange={onColorChange} />

                {/* Swatches area */}
                {presets && presets.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2 border-t justify-start items-center w-full max-w-[200px]">
                        {presets.map((presetColor, index) => (
                            <div
                                key={presetColor}
                                className={`relative w-6 h-6 rounded-full border shadow-sm cursor-pointer checkerboard-bg group ${
                                    selectedPresetIndex === index
                                        ? "border-primary ring-1 ring-primary/70"
                                        : "border-border"
                                }`}
                                style={{ backgroundColor: presetColor }}
                                onClick={() => {
                                    setSelectedPresetIndex(index);
                                    onColorChange(presetColor);
                                }}
                                onKeyDown={(event) => {
                                    if (
                                        event.key === "Enter" ||
                                        event.key === " "
                                    ) {
                                        event.preventDefault();
                                        setSelectedPresetIndex(index);
                                        onColorChange(presetColor);
                                    }
                                }}
                                onMouseEnter={() =>
                                    setHoveredPresetIndex(index)
                                }
                                onMouseLeave={() => setHoveredPresetIndex(null)}
                                role="button"
                                tabIndex={0}
                                aria-label={`Select preset ${presetColor}`}
                                title={presetColor}
                                data-testid={`main.color-picker.preset.${index}`}
                            >
                                {onRemovePreset &&
                                    hoveredPresetIndex === index && (
                                        <button
                                            className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-[1px] shadow-sm hover:scale-110 transition-transform"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onRemovePreset(presetColor);
                                                setSelectedPresetIndex(
                                                    (current) => {
                                                        if (current === null) {
                                                            return null;
                                                        }
                                                        if (current === index) {
                                                            return null;
                                                        }
                                                        if (current > index) {
                                                            return current - 1;
                                                        }
                                                        return current;
                                                    }
                                                );
                                                setHoveredPresetIndex(null);
                                            }}
                                            title="Remove"
                                            data-testid={`main.color-picker.action.remove-preset.${index}`}
                                        >
                                            <X size={10} />
                                        </button>
                                    )}
                            </div>
                        ))}

                        {/* Add Current Color Button */}
                        {onAddPreset && !isCurrentColorInPresets && (
                            <button
                                className="w-6 h-6 rounded-full border border-dashed border-muted-foreground flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors bg-transparent"
                                onClick={() => onAddPreset(color)}
                                title="Add current color to presets"
                                data-testid="main.color-picker.action.add-preset"
                            >
                                <Plus size={14} />
                            </button>
                        )}

                        {canUpdateSelectedPreset && selectedPresetColor && (
                            <button
                                className="w-6 h-6 rounded-full border border-dashed border-muted-foreground flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors bg-transparent"
                                onClick={() =>
                                    onUpdatePreset?.(selectedPresetColor, color)
                                }
                                title="Update selected preset with current color"
                                data-testid="main.color-picker.action.update-preset"
                            >
                                <PenLine size={14} />
                            </button>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}
