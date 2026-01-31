// @vitest-environment happy-dom
import { renderHook, act } from "@testing-library/react";
import { useMenuState } from "@/renderer/hooks/useMenuState";
import { describe, it, expect } from "vitest";

describe("useMenuState", () => {
    it("should handle setting dialog", () => {
        const { result } = renderHook(() => useMenuState());

        expect(result.current.openSettingDlg).toBe(false);

        act(() => {
            result.current.handleSettingDlgOpen();
        });
        expect(result.current.openSettingDlg).toBe(true);

        act(() => {
            result.current.handleSettingDlgClose();
        });
        expect(result.current.openSettingDlg).toBe(false);
    });

    it("should handle about dialog", () => {
        const { result } = renderHook(() => useMenuState());

        expect(result.current.openAboutDlg).toBe(false);

        act(() => {
            result.current.handleAboutDlgOpen();
        });
        expect(result.current.openAboutDlg).toBe(true);

        act(() => {
            result.current.handleAboutDlgClose();
        });
        expect(result.current.openAboutDlg).toBe(false);
    });
});

