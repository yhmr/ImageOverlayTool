/**
 * @vitest-environment happy-dom
 */
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { SettingDialog } from "@/renderer/main-window/dialogs/settings/SettingDialog";

const i18nMock = {
    language: "en",
    services: {
        resourceStore: {
            data: {
                en: {},
                ja: {},
            },
        },
    },
    changeLanguage: vi.fn((lang: string) => {
        i18nMock.language = lang;
    }),
};

const ipcMock = {
    loadSetting: vi.fn().mockResolvedValue({ language: "en", logLevel: "info" }),
    saveSetting: vi.fn().mockResolvedValue(undefined),
    exportSettings: vi.fn().mockResolvedValue("settings.json"),
    importSettings: vi.fn().mockResolvedValue({ language: "en", logLevel: "info" }),
};

vi.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (key: string) => key,
        i18n: i18nMock,
    }),
}));

vi.mock("@/renderer/providers/IpcServiceProvider", () => ({
    useIpcService: () => ipcMock,
}));

describe("SettingDialog", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        i18nMock.language = "en";
    });

    it("loads settings on mount", async () => {
        render(<SettingDialog open={true} onClose={vi.fn()} />);
        await waitFor(() => {
            expect(ipcMock.loadSetting).toHaveBeenCalledTimes(1);
        });
    });

    it("loads settings even when dialog is closed", async () => {
        render(<SettingDialog open={false} onClose={vi.fn()} />);
        await waitFor(() => {
            expect(ipcMock.loadSetting).toHaveBeenCalledTimes(1);
        });
    });

    it("persists current dialog settings including log level before exporting", async () => {
        render(<SettingDialog open={true} onClose={vi.fn()} />);

        await waitFor(() => {
            expect(ipcMock.loadSetting).toHaveBeenCalledTimes(1);
        });

        // Simulate user exporting (trigger persist)
        fireEvent.click(screen.getByText("render.setting_dlg.export"));

        await waitFor(() => {
            expect(ipcMock.saveSetting).toHaveBeenCalledWith({
                language: "en",
                logLevel: "info",
            });
            expect(ipcMock.exportSettings).toHaveBeenCalledTimes(1);
        });
    });

    it("imports settings and reflects imported values", async () => {
        (ipcMock.importSettings as Mock).mockResolvedValueOnce({
            language: "ja",
            logLevel: "debug",
        });

        render(<SettingDialog open={true} onClose={vi.fn()} />);

        fireEvent.click(screen.getByText("render.setting_dlg.import"));

        await waitFor(() => {
            expect(ipcMock.importSettings).toHaveBeenCalledTimes(1);
            expect(i18nMock.changeLanguage).toHaveBeenCalledWith("ja");
        });

        // Verify that internal state was updated by triggering a save
        fireEvent.click(screen.getByText("render.setting_dlg.done"));

        await waitFor(() => {
            expect(ipcMock.saveSetting).toHaveBeenCalledWith({
                language: "ja",
                logLevel: "debug",
            });
        });
    });
});
