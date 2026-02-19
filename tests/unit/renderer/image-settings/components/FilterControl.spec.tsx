/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { FilterControl } from "@/renderer/image-settings/components/FilterControl";

vi.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

vi.mock("@/renderer/components/ui/button", () => ({
    Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

vi.mock("@/renderer/components/ui/popover", () => ({
    Popover: ({ children }: any) => <div>{children}</div>,
    PopoverTrigger: ({ children }: any) => <div>{children}</div>,
    PopoverContent: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("@/renderer/components/ui/label", () => ({
    Label: ({ children, htmlFor, className }: any) => (
        <label htmlFor={htmlFor} className={className}>
            {children}
        </label>
    ),
}));

vi.mock("@/renderer/components/ui/switch", () => ({
    Switch: ({ id, checked, onCheckedChange }: any) => (
        <input
            id={id}
            type="checkbox"
            checked={checked}
            onChange={(event) => onCheckedChange(event.target.checked)}
        />
    ),
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

describe("FilterControl", () => {
    it("uses safe defaults and toggles binarization", () => {
        const onFilterChange = vi.fn();

        render(<FilterControl filters={undefined} onFilterChange={onFilterChange} />);

        fireEvent.click(screen.getByLabelText("render.image_settings.binarization"));

        expect(onFilterChange).toHaveBeenCalledWith({
            binarization: { enabled: true, threshold: 128 },
        });
    });

    it("updates threshold and HSV sliders when enabled", () => {
        const onFilterChange = vi.fn();
        render(
            <FilterControl
                filters={{
                    binarization: { enabled: true, threshold: 128 },
                    hsv: { enabled: true, h: 10, s: 20, v: 30 },
                }}
                onFilterChange={onFilterChange}
            />
        );

        const sliders = screen.getAllByRole("slider");
        fireEvent.change(sliders[0], { target: { value: "200" } });
        fireEvent.change(sliders[1], { target: { value: "30" } });
        fireEvent.change(sliders[2], { target: { value: "40" } });
        fireEvent.change(sliders[3], { target: { value: "50" } });

        expect(onFilterChange).toHaveBeenNthCalledWith(1, {
            binarization: { enabled: true, threshold: 200 },
            hsv: { enabled: true, h: 10, s: 20, v: 30 },
        });
        expect(onFilterChange).toHaveBeenNthCalledWith(2, {
            binarization: { enabled: true, threshold: 128 },
            hsv: { enabled: true, h: 30, s: 20, v: 30 },
        });
        expect(onFilterChange).toHaveBeenNthCalledWith(3, {
            binarization: { enabled: true, threshold: 128 },
            hsv: { enabled: true, h: 10, s: 40, v: 30 },
        });
        expect(onFilterChange).toHaveBeenNthCalledWith(4, {
            binarization: { enabled: true, threshold: 128 },
            hsv: { enabled: true, h: 10, s: 20, v: 50 },
        });
    });
});
