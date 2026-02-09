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
        useAppStore.getState().resetAll();
        vi.clearAllMocks();
    });

    it("renders stable selectors and supports add action", () => {
        render(<ImageList />);

        expect(screen.getByTestId("settings.image-list.root")).toBeTruthy();
        expect(screen.getByTestId("settings.image-list.items")).toBeTruthy();
        expect(screen.getByTestId("settings.image-list.add")).toBeTruthy();
        expect(screen.getByTestId("settings.unit.factor-input")).toBeTruthy();
        expect(screen.getByTestId("settings.unit.select")).toBeTruthy();

        fireEvent.click(screen.getByTestId("settings.image-list.add"));

        expect(useAppStore.getState().imageSets.length).toBe(2);
        expect(mockIPC.updateImageSets).toHaveBeenCalledTimes(1);
    });
});

