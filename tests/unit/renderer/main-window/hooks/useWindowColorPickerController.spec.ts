/**
 * @vitest-environment happy-dom
 */
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useWindowColorPickerController } from "@/renderer/main-window/hooks/useWindowColorPickerController";
import { useAppStore } from "@/renderer/store/useAppStore";

const { mockUseIpcService, mockSaveWindowColor, mockSaveWindowColorPresets } =
    vi.hoisted(() => ({
        mockUseIpcService: vi.fn(),
        mockSaveWindowColor: vi.fn().mockResolvedValue(undefined),
        mockSaveWindowColorPresets: vi.fn().mockResolvedValue(undefined),
    }));

vi.mock("@/renderer/providers/IpcServiceProvider", () => ({
    useIpcService: mockUseIpcService,
}));

describe("useWindowColorPickerController", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useAppStore.getState().resetAll();
        useAppStore.getState().setWindowColorPresets(["#112233"]);
        mockUseIpcService.mockReturnValue({
            saveWindowColor: mockSaveWindowColor,
            saveWindowColorPresets: mockSaveWindowColorPresets,
        });
    });

    it("preserves empty preset list when removing the last swatch", () => {
        const { result } = renderHook(() => useWindowColorPickerController());

        act(() => {
            result.current.removePreset("#112233");
        });

        expect(useAppStore.getState().windowColorPresets).toEqual([]);
        expect(mockSaveWindowColorPresets).toHaveBeenCalledWith([]);
    });
});

