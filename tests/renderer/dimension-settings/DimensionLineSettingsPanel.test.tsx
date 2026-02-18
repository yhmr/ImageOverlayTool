/**
 * @vitest-environment happy-dom
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { DimensionLineSettingsPanel } from "@/renderer/dimension-settings/components/DimensionLineSettingsPanel";
import { IpcServiceProvider } from "@/renderer/providers/IpcServiceProvider";
import { useAppStore } from "@/renderer/store/useAppStore";
import { MockIPCService } from "../../mocks/MockIPCService";

vi.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (key: string, params?: { index?: number }) =>
            params?.index ? `${key} ${params.index}` : key,
    }),
}));

describe("DimensionLineSettingsPanel", () => {
    beforeEach(() => {
        useAppStore.getState().resetAll();
    });

    it("controls dimension settings in dedicated window panel", () => {
        const ipcService = new MockIPCService();
        useAppStore.getState().addDimensionLine({
            id: "line-1",
            start: { x: 0, y: 0 },
            end: { x: 100, y: 0 },
        });

        render(
            <IpcServiceProvider service={ipcService}>
                <DimensionLineSettingsPanel />
            </IpcServiceProvider>
        );

        expect(
            screen.getByTestId("dimension-settings.mode.add-button")
        ).toBeTruthy();
        expect(
            screen.getByTestId("dimension-settings.unit.factor-input")
        ).toBeTruthy();
        expect(screen.getByTestId("dimension-settings.unit.select")).toBeTruthy();

        fireEvent.click(screen.getByTestId("dimension-settings.mode.add-button"));
        expect(useAppStore.getState().interactionMode).toBe("dimension_add");

        fireEvent.click(screen.getByTestId("dimension-settings.line.0"));
        expect(useAppStore.getState().interactionMode).toBe("dimension_select");
        expect(useAppStore.getState().selectedDimensionLineId).toBe("line-1");

        fireEvent.change(
            screen.getByTestId("dimension-settings.unit.factor-input"),
            {
                target: { value: "2" },
            }
        );
        expect(useAppStore.getState().unitFactor).toBe(2);

        fireEvent.change(screen.getByTestId("dimension-settings.line.0.color"), {
            target: { value: "#ff0000" },
        });
        expect(useAppStore.getState().dimensionLines[0].color).toBe("#ff0000");

        fireEvent.click(
            screen.getByTestId("dimension-settings.line.0.delete")
        );
        expect(useAppStore.getState().dimensionLines).toHaveLength(0);
    });
});
