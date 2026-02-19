/**
 * @vitest-environment happy-dom
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { ImageList } from "@/renderer/image-settings/components/ImageList";
import { useAppStore } from "@/renderer/store/useAppStore";

const mockIPC = vi.hoisted(() => ({
    log: {
        info: vi.fn(),
    },
    getImageInfo: vi.fn().mockResolvedValue({ exists: true, width: 10, height: 10 }),
    updateImageSets: vi.fn().mockResolvedValue(undefined),
    updateUnitFactor: vi.fn().mockResolvedValue(undefined),
    updateUnit: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

vi.mock("@/renderer/services/ipcService", () => ({
    getIPCService: () => mockIPC,
    setIPCService: vi.fn(),
}));

describe("ImageList test ids", () => {
    beforeEach(() => {
        if (!document.doctype) {
            const doctype = document.implementation.createDocumentType(
                "html",
                "",
                ""
            );
            document.insertBefore(doctype, document.documentElement);
        }
        useAppStore.getState().resetAll();
        vi.clearAllMocks();
    });

    it("renders stable selectors and supports add action", () => {
        render(<ImageList />);

        expect(screen.getByTestId("settings.image-list.root")).toBeTruthy();
        expect(screen.getByTestId("settings.image-list.items")).toBeTruthy();
        expect(screen.getByTestId("settings.image-list.add")).toBeTruthy();

        fireEvent.click(screen.getByTestId("settings.image-list.add"));

        expect(useAppStore.getState().imageSets.length).toBe(2);
        // 単体テストでは同期ブリッジをマウントしないためIPC送信は行われない
        expect(mockIPC.updateImageSets).not.toHaveBeenCalled();
    });
});
