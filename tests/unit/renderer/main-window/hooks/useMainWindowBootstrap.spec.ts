/**
 * @vitest-environment happy-dom
 */
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useMainWindowBootstrap } from "@/renderer/main-window/hooks/useMainWindowBootstrap";
import { useAppStore } from "@/renderer/store/useAppStore";

const {
    mockUseIpcService,
    mockLoadWindowColor,
    mockLoadWindowColorPresets,
    mockLoadSetting,
    mockUpdateProjectDirty,
} = vi.hoisted(() => ({
    mockUseIpcService: vi.fn(),
    mockLoadWindowColor: vi.fn(),
    mockLoadWindowColorPresets: vi.fn(),
    mockLoadSetting: vi.fn(),
    mockUpdateProjectDirty: vi.fn(),
}));

vi.mock("@/renderer/providers/IpcServiceProvider", () => ({
    useIpcService: mockUseIpcService,
}));

describe("useMainWindowBootstrap", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useAppStore.getState().resetAll();
        mockLoadWindowColor.mockResolvedValue("#11223344");
        mockLoadWindowColorPresets.mockResolvedValue(["#445566", "#AABBCC"]);
        mockLoadSetting.mockResolvedValue({
            language: "en",
            logLevel: "info",
            showWindowFrame: true,
        });
        mockUpdateProjectDirty.mockResolvedValue(undefined);
        mockUseIpcService.mockReturnValue({
            loadWindowColor: mockLoadWindowColor,
            loadWindowColorPresets: mockLoadWindowColorPresets,
            loadSetting: mockLoadSetting,
            updateProjectDirty: mockUpdateProjectDirty,
        });
    });

    it("loads app config and marks project clean on bootstrap", async () => {
        act(() => {
            useAppStore.getState().addImageSetWithPath("C:/tmp/dirty.png");
        });
        expect(useAppStore.getState().hasUnsavedChanges).toBe(true);

        renderHook(() => useMainWindowBootstrap());

        await waitFor(() => {
            expect(useAppStore.getState().windowColor).toBe("#11223344");
            expect(useAppStore.getState().windowColorPresets).toEqual([
                "#445566",
                "#AABBCC",
            ]);
            expect(useAppStore.getState().isWindowFrameVisible).toBe(true);
            expect(useAppStore.getState().hasUnsavedChanges).toBe(false);
        });

        expect(mockLoadWindowColor).toHaveBeenCalledTimes(1);
        expect(mockLoadWindowColorPresets).toHaveBeenCalledTimes(1);
        expect(mockLoadSetting).toHaveBeenCalledTimes(1);
    });

    it("reports project dirty state changes through IPC", async () => {
        renderHook(() => useMainWindowBootstrap());

        await waitFor(() => {
            expect(mockUpdateProjectDirty).toHaveBeenCalledWith(false);
        });

        act(() => {
            useAppStore.getState().setWindowColor("#01020304");
        });

        await waitFor(() => {
            expect(mockUpdateProjectDirty).toHaveBeenCalledWith(true);
        });
    });
});
