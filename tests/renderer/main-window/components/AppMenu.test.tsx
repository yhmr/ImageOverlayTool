/**
 * @vitest-environment happy-dom
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { AppMenu } from "@/renderer/main-window/components/AppMenu";
import type { MainWindowActions } from "@/renderer/main-window/hooks/useMainWindowActions";

const { exportLogs } = vi.hoisted(() => ({
    exportLogs: vi.fn().mockResolvedValue("logs.txt"),
}));

vi.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

vi.mock("@/renderer/services/ipcService", () => ({
    getIPCService: () => ({
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
        const openImageSettingsWindow = vi.fn();
        const openDimensionSettingsWindow = vi.fn();
        const captureBackground = vi.fn();
        const toggleClickThroughMode = vi.fn();
        const onOpenWindowColorPicker = vi.fn();
        const mainWindowActions: MainWindowActions = {
            isClickThroughMode: false,
            openImageSettingsWindow,
            openDimensionSettingsWindow,
            captureBackground,
            toggleClickThroughMode,
            disableClickThroughMode: vi.fn(),
        };

        render(
            <AppMenu
                openSettingDialog={vi.fn()}
                openAboutDialog={vi.fn()}
                openImageExportDialog={vi.fn()}
                onOpenWindowColorPicker={onOpenWindowColorPicker}
                closeWindow={vi.fn()}
                newProject={vi.fn()}
                openProject={vi.fn()}
                saveProject={vi.fn()}
                saveProjectAs={vi.fn()}
                onExportLogs={exportLogs}
                mainWindowActions={mainWindowActions}
            />
        );

        const trigger = screen.getByTestId("main.menu.trigger");
        const ensureMenuOpen = async () => {
            if (screen.queryByTestId("main.menu.content")) {
                return;
            }
            fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false });
            await waitFor(() => {
                expect(screen.getByTestId("main.menu.content")).toBeTruthy();
            });
        };

        await ensureMenuOpen();

        expect(screen.getByTestId("main.menu.item.new-project")).toBeTruthy();
        expect(screen.getByTestId("main.menu.item.open-project")).toBeTruthy();
        expect(screen.getByTestId("main.menu.item.save-project")).toBeTruthy();
        expect(
            screen.getByTestId("main.menu.item.save-project-as")
        ).toBeTruthy();

        fireEvent.click(screen.getByTestId("main.menu.item.open-image-settings"));
        expect(openImageSettingsWindow).toHaveBeenCalledTimes(1);

        await ensureMenuOpen();
        fireEvent.click(
            screen.getByTestId("main.menu.item.open-dimension-settings")
        );
        expect(openDimensionSettingsWindow).toHaveBeenCalledTimes(1);

        await ensureMenuOpen();
        expect(
            screen.getByTestId("main.menu.item.capture-background")
        ).toBeTruthy();
        expect(screen.getByTestId("main.menu.item.export-image")).toBeTruthy();
        expect(
            screen.getByTestId("main.menu.item.background-style")
        ).toBeTruthy();
        expect(
            screen.getByTestId("main.menu.item.click-through-mode")
        ).toBeTruthy();

        fireEvent.click(screen.getByTestId("main.menu.item.capture-background"));
        expect(captureBackground).toHaveBeenCalledTimes(1);

        await ensureMenuOpen();
        fireEvent.click(screen.getByTestId("main.menu.item.background-style"));
        expect(onOpenWindowColorPicker).toHaveBeenCalledTimes(1);

        await ensureMenuOpen();
        fireEvent.click(screen.getByTestId("main.menu.item.click-through-mode"));
        expect(toggleClickThroughMode).toHaveBeenCalledTimes(1);

        await ensureMenuOpen();
        fireEvent.click(screen.getByTestId("main.menu.item.help-manual"));

        await ensureMenuOpen();
        fireEvent.click(screen.getByTestId("main.menu.item.export-logs"));

        expect(exportLogs).toHaveBeenCalledTimes(1);
        expect(openSpy).toHaveBeenCalledWith(
            "https://yhmr.github.io/ImageOverlayTool/guide/",
            "_blank"
        );
        openSpy.mockRestore();
    });

    it("renders disable label when click-through mode is enabled", async () => {
        render(
            <AppMenu
                openSettingDialog={vi.fn()}
                openAboutDialog={vi.fn()}
                openImageExportDialog={vi.fn()}
                onOpenWindowColorPicker={vi.fn()}
                closeWindow={vi.fn()}
                newProject={vi.fn()}
                openProject={vi.fn()}
                saveProject={vi.fn()}
                saveProjectAs={vi.fn()}
                onExportLogs={vi.fn()}
                mainWindowActions={{
                    isClickThroughMode: true,
                    openImageSettingsWindow: vi.fn(),
                    openDimensionSettingsWindow: vi.fn(),
                    captureBackground: vi.fn(),
                    toggleClickThroughMode: vi.fn(),
                    disableClickThroughMode: vi.fn(),
                }}
            />
        );

        fireEvent.pointerDown(screen.getByTestId("main.menu.trigger"), {
            button: 0,
            ctrlKey: false,
        });

        await waitFor(() => {
            expect(
                screen.getByText("render.menu.click_through_mode_disable")
            ).toBeTruthy();
        });
    });
});
