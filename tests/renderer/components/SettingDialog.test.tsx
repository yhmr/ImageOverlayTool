/**
 * @vitest-environment happy-dom
 */
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { SettingDialog } from "@/renderer/main-window/components/SettingDialog";

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
    loadSetting: vi.fn().mockResolvedValue({ language: "en" }),
    saveSetting: vi.fn().mockResolvedValue(undefined),
    exportSettings: vi.fn().mockResolvedValue("settings.json"),
    importSettings: vi.fn().mockResolvedValue({ language: "en" }),
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

describe("SettingDialog export", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        i18nMock.language = "en";
    });

    it("persists current dialog settings before exporting", async () => {
        render(<SettingDialog open={true} onClose={vi.fn()} />);

        await waitFor(() => {
            expect(ipcMock.loadSetting).toHaveBeenCalledTimes(1);
        });

        // Simulate user changing language in the open dialog.
        i18nMock.language = "ja";

        fireEvent.click(screen.getByText("render.setting_dlg.export"));

        await waitFor(() => {
            expect(ipcMock.saveSetting).toHaveBeenCalledWith({
                language: "ja",
            });
            expect(ipcMock.exportSettings).toHaveBeenCalledTimes(1);
        });
    });

    it("imports settings and reflects imported language", async () => {
        (ipcMock.importSettings as Mock).mockResolvedValueOnce({ language: "ja" });

        render(<SettingDialog open={true} onClose={vi.fn()} />);

        fireEvent.click(screen.getByText("render.setting_dlg.import"));

        await waitFor(() => {
            expect(ipcMock.importSettings).toHaveBeenCalledTimes(1);
            expect(i18nMock.changeLanguage).toHaveBeenCalledWith("ja");
        });
    });
});
