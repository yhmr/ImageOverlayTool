/**
 * @vitest-environment happy-dom
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { AppMenu } from "@/renderer/main-window/components/AppMenu";

const {
    toggleImageSettingsWindow,
    toggleDimensionSettingsWindow,
    exportLogs,
    saveWindowColor,
} = vi.hoisted(() => ({
    toggleImageSettingsWindow: vi.fn().mockResolvedValue(true),
    toggleDimensionSettingsWindow: vi.fn().mockResolvedValue(true),
    exportLogs: vi.fn().mockResolvedValue("logs.txt"),
    saveWindowColor: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

vi.mock("@/renderer/services/ipcService", () => ({
    getIPCService: () => ({
        toggleImageSettingsWindow,
        toggleDimensionSettingsWindow,
        captureScreen: vi.fn().mockResolvedValue(null),
        saveWindowColor,
        log: {
            export: exportLogs,
            info: vi.fn(),
            error: vi.fn(),
        },
    }),
}));

describe("AppMenu test ids", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders stable menu test ids and triggers menu actions", async () => {
        const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);

        render(
            <AppMenu
                openSettingDialog={vi.fn()}
                openAboutDialog={vi.fn()}
                openImageExportDialog={vi.fn()}
                closeWindow={vi.fn()}
                newProject={vi.fn()}
                openProject={vi.fn()}
                saveProject={vi.fn()}
                saveProjectAs={vi.fn()}
            />
        );

        const trigger = screen.getByTestId("main.menu.trigger");
        const openMenu = async () => {
            fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false });
            await waitFor(() => {
                expect(screen.getByTestId("main.menu.content")).toBeTruthy();
            });
        };

        await openMenu();

        expect(screen.getByTestId("main.menu.item.new-project")).toBeTruthy();
        expect(screen.getByTestId("main.menu.item.open-project")).toBeTruthy();
        expect(screen.getByTestId("main.menu.item.save-project")).toBeTruthy();
        expect(
            screen.getByTestId("main.menu.item.save-project-as")
        ).toBeTruthy();

        fireEvent.click(
            screen.getByTestId("main.menu.item.open-image-settings")
        );

        await openMenu();
        fireEvent.click(
            screen.getByTestId("main.menu.item.open-dimension-settings")
        );

        await openMenu();
        expect(screen.getByTestId("main.menu.item.capture-background")).toBeTruthy();
        expect(screen.getByTestId("main.menu.item.export-image")).toBeTruthy();
        expect(screen.getByTestId("main.menu.item.background-style")).toBeTruthy();
        expect(screen.getByTestId("main.menu.item.click-through-mode")).toBeTruthy();

        fireEvent.click(screen.getByTestId("main.menu.item.background-style"));
        expect(screen.getByTestId("main.color-picker.overlay")).toBeTruthy();
        fireEvent.click(screen.getByTestId("main.color-picker.overlay"));

        await openMenu();
        fireEvent.click(screen.getByTestId("main.menu.item.help-manual"));

        await openMenu();
        fireEvent.click(screen.getByTestId("main.menu.item.export-logs"));

        expect(toggleImageSettingsWindow).toHaveBeenCalledTimes(1);
        expect(toggleDimensionSettingsWindow).toHaveBeenCalledTimes(1);
        expect(saveWindowColor).toHaveBeenCalledTimes(1);
        expect(exportLogs).toHaveBeenCalledTimes(1);
        expect(openSpy).toHaveBeenCalledWith(
            "https://yhmr.github.io/ImageOverlayTool/guide/",
            "_blank"
        );
        openSpy.mockRestore();
    });
});
