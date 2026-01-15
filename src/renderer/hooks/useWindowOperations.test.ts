// @vitest-environment happy-dom
import { renderHook, act } from "@testing-library/react";
import { useWindowOperations } from "./useWindowOperations";
import { describe, it, expect, vi, beforeEach } from "vitest";

describe("useWindowOperations", () => {
    beforeEach(() => {
        // Mock window.electronAPI
        window.electronAPI = {
            switchWindowSize: vi.fn().mockResolvedValue(true),
            closeWindow: vi.fn(),
        } as any;
    });

    it("should switch full screen", async () => {
        const { result } = renderHook(() => useWindowOperations());

        expect(result.current.full).toBe(false);

        await act(async () => {
            await result.current.handleSwitchFullScreen();
        });

        expect(window.electronAPI.switchWindowSize).toHaveBeenCalled();
        expect(result.current.full).toBe(true);
    });

    it("should close window", () => {
        const { result } = renderHook(() => useWindowOperations());

        act(() => {
            result.current.handleCloseWindow();
        });

        expect(window.electronAPI.closeWindow).toHaveBeenCalled();
    });
});
