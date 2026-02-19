/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { ScaleControl } from "@/renderer/image-settings/components/ScaleControl";

vi.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

vi.mock("@/renderer/components/ui/slider", () => ({
    Slider: ({ min, max, step, value, onValueChange }: any) => (
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value?.[0] ?? 1}
            onChange={(event) => onValueChange([Number(event.target.value)])}
        />
    ),
}));

describe("ScaleControl", () => {
    it("shows percent and forwards slider updates", () => {
        const onChange = vi.fn();
        render(<ScaleControl scale={1.25} onChange={onChange} />);

        expect(screen.getByText("125%")).toBeTruthy();

        const slider = screen.getByRole("slider");
        fireEvent.change(slider, { target: { value: "2" } });

        expect(onChange).toHaveBeenCalledWith([2]);
    });
});
