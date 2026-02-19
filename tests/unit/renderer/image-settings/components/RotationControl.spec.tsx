/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { RotationControl } from "@/renderer/image-settings/components/RotationControl";

vi.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

vi.mock("@/renderer/components/ui/slider", () => ({
    Slider: ({ min, max, value, onValueChange }: any) => (
        <input
            type="range"
            min={min}
            max={max}
            value={value?.[0] ?? 0}
            onChange={(event) => onValueChange([Number(event.target.value)])}
        />
    ),
}));

vi.mock("@/renderer/components/ui/input", () => ({
    Input: ({ value, onChange, ...props }: any) => (
        <input value={value} onChange={onChange} {...props} />
    ),
}));

describe("RotationControl", () => {
    it("shows rounded rotation value and forwards slider/input updates", () => {
        const onRotationChange = vi.fn();
        const onInputChange = vi.fn();

        render(
            <RotationControl
                rotation={12.7}
                onRotationChange={onRotationChange}
                onInputChange={onInputChange}
            />
        );

        const slider = screen.getByRole("slider");
        fireEvent.change(slider, { target: { value: "45" } });
        expect(onRotationChange).toHaveBeenCalledWith([45]);

        const input = screen.getByDisplayValue("13");
        fireEvent.change(input, { target: { value: "99" } });
        expect(onInputChange).toHaveBeenCalledTimes(1);
    });
});
