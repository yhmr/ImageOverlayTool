// @vitest-environment happy-dom
import { renderHook, act } from "@testing-library/react";
import { useMenuState } from "@/renderer/hooks/useMenuState";
import { describe, it, expect } from "vitest";

describe("useMenuState", () => {
    it("should handle setting dialog", () => {
        const { result } = renderHook(() => useMenuState());

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
        const { result } = renderHook(() => useMenuState());

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
});

