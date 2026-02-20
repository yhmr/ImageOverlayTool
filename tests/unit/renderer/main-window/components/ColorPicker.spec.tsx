/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { ColorPicker } from "@/renderer/main-window/components/ColorPicker";

vi.mock("react-colorful", () => ({
    HexAlphaColorPicker: ({
        color,
        onChange,
    }: {
        color: string;
        onChange: (color: string) => void;
    }) => (
        <input
            data-testid="main.color-picker.mock-input"
            value={color}
            onChange={(event) => onChange(event.currentTarget.value)}
        />
    ),
}));

describe("ColorPicker preset editing", () => {
    it("updates selected preset with current color", () => {
        const onColorChange = vi.fn();
        const onUpdatePreset = vi.fn();

        render(
            <ColorPicker
                isOpen
                onOpenChange={vi.fn()}
                color="#12345678"
                onColorChange={onColorChange}
                onColorChangeComplete={vi.fn()}
                presets={["#FF0000", "#00FF00"]}
                onUpdatePreset={onUpdatePreset}
            />
        );

        fireEvent.click(screen.getByTestId("main.color-picker.preset.1"));
        expect(onColorChange).toHaveBeenCalledWith("#00FF00");

        fireEvent.click(
            screen.getByTestId("main.color-picker.action.update-preset")
        );
        expect(onUpdatePreset).toHaveBeenCalledWith("#00FF00", "#12345678");
    });

    it("does not show update button when selected preset equals current color", () => {
        render(
            <ColorPicker
                isOpen
                onOpenChange={vi.fn()}
                color="#00FF00"
                onColorChange={vi.fn()}
                onColorChangeComplete={vi.fn()}
                presets={["#00FF00"]}
                onUpdatePreset={vi.fn()}
            />
        );

        fireEvent.click(screen.getByTestId("main.color-picker.preset.0"));
        expect(
            screen.queryByTestId("main.color-picker.action.update-preset")
        ).toBeNull();
    });
});
