// @vitest-environment happy-dom
import { renderHook, act } from "@testing-library/react";
import { useMainWindowDialogState } from "@/renderer/main-window/hooks/useMainWindowDialogState";
import { describe, it, expect } from "vitest";

describe("useMainWindowDialogState", () => {
    it("should handle setting dialog", () => {
        const { result } = renderHook(() => useMainWindowDialogState());

        expect(result.current.isSettingDialogOpen).toBe(false);

        act(() => {
            result.current.openSettingDialog();
        });
        expect(result.current.isSettingDialogOpen).toBe(true);

        act(() => {
            result.current.closeSettingDialog();
        });
        expect(result.current.isSettingDialogOpen).toBe(false);
    });

    it("should handle about dialog", () => {
        const { result } = renderHook(() => useMainWindowDialogState());

        expect(result.current.isAboutDialogOpen).toBe(false);

        act(() => {
            result.current.openAboutDialog();
        });
        expect(result.current.isAboutDialogOpen).toBe(true);

        act(() => {
            result.current.closeAboutDialog();
        });
        expect(result.current.isAboutDialogOpen).toBe(false);
    });

    it("should handle image export dialog", () => {
        const { result } = renderHook(() => useMainWindowDialogState());

        expect(result.current.isImageExportDialogOpen).toBe(false);

        act(() => {
            result.current.openImageExportDialog();
        });
        expect(result.current.isImageExportDialogOpen).toBe(true);

        act(() => {
            result.current.closeImageExportDialog();
        });
        expect(result.current.isImageExportDialogOpen).toBe(false);
    });
});

