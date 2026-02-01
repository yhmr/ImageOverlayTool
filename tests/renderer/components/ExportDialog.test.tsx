/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ExportDialog } from "@/renderer/main-window/components/ExportDialog";

// Mock translation
vi.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (key: string, defaultValue?: string) => defaultValue || key,
    }),
}));

// Mock Dialog components if necessary, but Radix UI usually works.
// If needed, we can rely on standard rendering.

describe("ExportDialog", () => {
    it("should render when open is true", () => {
        render(
            <ExportDialog
                open={true}
                onClose={() => { }}
                onExport={() => { }}
            />
        );
        expect(screen.getByText("画像を保存")).toBeTruthy();
    });

    it("should call onExport with false when background is not included (default)", () => {
        const onExport = vi.fn();
        const onClose = vi.fn();
        render(
            <ExportDialog
                open={true}
                onClose={onClose}
                onExport={onExport}
            />
        );

        // Click Save button (text: 保存)
        fireEvent.click(screen.getByText("保存"));

        expect(onExport).toHaveBeenCalledWith(false);
        expect(onClose).toHaveBeenCalled();
    });

    it("should call onExport with true when background switch is toggled", () => {
        const onExport = vi.fn();
        const onClose = vi.fn();
        render(
            <ExportDialog
                open={true}
                onClose={onClose}
                onExport={onExport}
            />
        );

        // Find Switch. Switch usually has role="switch".
        const switchEl = screen.getByRole("switch");
        fireEvent.click(switchEl);

        // Click Save button
        fireEvent.click(screen.getByText("保存"));

        expect(onExport).toHaveBeenCalledWith(true);
        expect(onClose).toHaveBeenCalled();
    });

    it("should call onClose when cancel is clicked", () => {
        const onExport = vi.fn();
        const onClose = vi.fn();
        render(
            <ExportDialog
                open={true}
                onClose={onClose}
                onExport={onExport}
            />
        );

        fireEvent.click(screen.getByText("キャンセル"));

        expect(onExport).not.toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
    });
});
