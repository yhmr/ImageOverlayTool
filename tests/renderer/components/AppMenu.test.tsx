/**
 * @vitest-environment happy-dom
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { AppMenu } from "@/renderer/main-window/components/AppMenu";

const { toggleImageSettingsWindow } = vi.hoisted(() => ({
    toggleImageSettingsWindow: vi.fn().mockResolvedValue(true),
}));

vi.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

vi.mock("@/renderer/services/ipcService", () => ({
    getIPCService: () => ({
        toggleImageSettingsWindow,
    }),
}));

describe("AppMenu test ids", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders stable menu test ids and triggers image-settings action", async () => {
        render(
            <AppMenu
                openSettingDialog={vi.fn()}
                openAboutDialog={vi.fn()}
                handleCloseWindow={vi.fn()}
                handleNewProject={vi.fn()}
                handleOpenProject={vi.fn()}
                handleSaveProject={vi.fn()}
                handleSaveProjectAs={vi.fn()}
            />
        );

        const trigger = screen.getByTestId("main.menu.trigger");
        fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false });

        await waitFor(() => {
            expect(screen.getByTestId("main.menu.content")).toBeTruthy();
        });

        expect(screen.getByTestId("main.menu.item.new-project")).toBeTruthy();
        expect(screen.getByTestId("main.menu.item.open-project")).toBeTruthy();
        expect(screen.getByTestId("main.menu.item.save-project")).toBeTruthy();
        expect(screen.getByTestId("main.menu.item.save-project-as")).toBeTruthy();

        fireEvent.click(screen.getByTestId("main.menu.item.open-image-settings"));

        expect(toggleImageSettingsWindow).toHaveBeenCalledTimes(1);
    });
});

