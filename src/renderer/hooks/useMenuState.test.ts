// @vitest-environment happy-dom
import { renderHook, act } from "@testing-library/react";
import { useMenuState } from "./useMenuState";
import { describe, it, expect } from "vitest";

describe("useMenuState", () => {
  it("should handle menu open/close", () => {
    const { result } = renderHook(() => useMenuState());

    expect(result.current.anchorEl).toBeNull();
    expect(result.current.openMenu).toBe(false);

    const mockElement = document.createElement("div");
    const event = { currentTarget: mockElement } as any;

    act(() => {
      result.current.handleMenuClick(event);
    });

    expect(result.current.anchorEl).toBe(mockElement);
    expect(result.current.openMenu).toBe(true);

    act(() => {
      result.current.handleMenuClose();
    });

    expect(result.current.anchorEl).toBeNull();
    expect(result.current.openMenu).toBe(false);
  });

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
});
