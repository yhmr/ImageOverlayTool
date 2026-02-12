/**
 * @vitest-environment happy-dom
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { AppMenu } from "@/renderer/main-window/components/AppMenu";

const { toggleImageSettingsWindow, exportLogs } = vi.hoisted(() => ({
    toggleImageSettingsWindow: vi.fn().mockResolvedValue(true),
    exportLogs: vi.fn().mockResolvedValue("logs.txt"),
}));

vi.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

vi.mock("@/renderer/services/ipcService", () => ({
    getIPCService: () => ({
        toggleImageSettingsWindow,
        log: {
            export: exportLogs,
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
        fireEvent.click(screen.getByTestId("main.menu.item.help-manual"));

        await openMenu();
        fireEvent.click(screen.getByTestId("main.menu.item.export-logs"));

        expect(toggleImageSettingsWindow).toHaveBeenCalledTimes(1);
        expect(exportLogs).toHaveBeenCalledTimes(1);
        expect(openSpy).toHaveBeenCalledWith(
            "https://yhmr.github.io/ImageOverlayTool/guide/",
            "_blank"
        );
        openSpy.mockRestore();
    });
});
