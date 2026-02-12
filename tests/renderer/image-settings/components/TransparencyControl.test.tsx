/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { TransparencyControl } from "@/renderer/image-settings/components/TransparencyControl";

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
            value={value?.[0] ?? 0}
            onChange={(event) => onValueChange([Number(event.target.value)])}
        />
    ),
}));

describe("TransparencyControl", () => {
    it("shows percentage text and forwards slider updates", () => {
        const onChange = vi.fn();

        render(<TransparencyControl transparency={0.37} onChange={onChange} />);

        expect(screen.getByText("37%")).toBeTruthy();

        fireEvent.change(screen.getByRole("slider"), { target: { value: "0.5" } });
        expect(onChange).toHaveBeenCalledWith([0.5]);
    });
});
