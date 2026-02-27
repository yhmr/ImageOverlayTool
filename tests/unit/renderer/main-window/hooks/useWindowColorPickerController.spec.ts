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

    it("applies normalized window color and persists by default", () => {
        const { result } = renderHook(() => useWindowColorPickerController());

        act(() => {
            result.current.applyColor("invalid-color");
        });

        expect(useAppStore.getState().windowColor).toBe("#FFFFFF55");
        expect(mockSaveWindowColor).toHaveBeenCalledWith("#FFFFFF55");
    });

    it("applies color without persistence when persist is false", () => {
        const { result } = renderHook(() => useWindowColorPickerController());

        act(() => {
            result.current.applyColor("#11223344", false);
        });

        expect(useAppStore.getState().windowColor).toBe("#11223344");
        expect(mockSaveWindowColor).not.toHaveBeenCalled();
    });

    it("adds preset only when normalized preset list changes", () => {
        const { result } = renderHook(() => useWindowColorPickerController());

        act(() => {
            result.current.addPreset("#AABBCC");
        });

        expect(useAppStore.getState().windowColorPresets).toEqual([
            "#112233",
            "#AABBCC",
        ]);
        expect(mockSaveWindowColorPresets).toHaveBeenCalledWith([
            "#112233",
            "#AABBCC",
        ]);

        vi.clearAllMocks();
        act(() => {
            result.current.addPreset("#aabbcc");
        });

        expect(mockSaveWindowColorPresets).not.toHaveBeenCalled();
        expect(useAppStore.getState().windowColorPresets).toEqual([
            "#112233",
            "#AABBCC",
        ]);
    });

    it("removes preset with case-insensitive match", () => {
        useAppStore.getState().setWindowColorPresets(["#112233", "#AABBCC"]);
        const { result } = renderHook(() => useWindowColorPickerController());

        act(() => {
            result.current.removePreset("#aabbcc");
        });

        expect(useAppStore.getState().windowColorPresets).toEqual(["#112233"]);
        expect(mockSaveWindowColorPresets).toHaveBeenCalledWith(["#112233"]);
    });

    it("updates matching preset with normalized value", () => {
        useAppStore.getState().setWindowColorPresets(["#112233", "#AABBCC"]);
        const { result } = renderHook(() => useWindowColorPickerController());

        act(() => {
            result.current.updatePreset("#aabbcc", "#01020304");
        });

        expect(useAppStore.getState().windowColorPresets).toEqual([
            "#112233",
            "#01020304",
        ]);
        expect(mockSaveWindowColorPresets).toHaveBeenCalledWith([
            "#112233",
            "#01020304",
        ]);
    });

    it("does nothing when update target does not exist", () => {
        const { result } = renderHook(() => useWindowColorPickerController());

        act(() => {
            result.current.updatePreset("#445566", "#01020304");
        });

        expect(mockSaveWindowColorPresets).not.toHaveBeenCalled();
        expect(useAppStore.getState().windowColorPresets).toEqual(["#112233"]);
    });

    it("does nothing when update results in the same normalized presets", () => {
        useAppStore.getState().setWindowColorPresets(["#112233", "#AABBCC"]);
        const { result } = renderHook(() => useWindowColorPickerController());

        act(() => {
            result.current.updatePreset("#AABBCC", "#AABBCC");
        });

        expect(mockSaveWindowColorPresets).not.toHaveBeenCalled();
        expect(useAppStore.getState().windowColorPresets).toEqual([
            "#112233",
            "#AABBCC",
        ]);
    });
});
