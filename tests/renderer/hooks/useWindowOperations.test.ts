// @vitest-environment happy-dom
import { renderHook, act } from "@testing-library/react";
import { useWindowOperations } from "@/renderer/hooks/useWindowOperations";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { setIPCService } from "@/renderer/services/ipcService";

// Mock IPCService
const mockIPC = vi.hoisted(() => ({
    switchWindowSize: vi.fn(),
    closeWindow: vi.fn(),
    log: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}));

vi.mock("@/renderer/services/ipcService", () => ({
    getIPCService: () => mockIPC,
    setIPCService: vi.fn(),
}));

describe("useWindowOperations", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockIPC.switchWindowSize.mockResolvedValue(true);
    });

    it("should toggle maximized state", async () => {
        const { result } = renderHook(() => useWindowOperations());

        expect(result.current.isMaximized).toBe(false);

        await act(async () => {
            await result.current.handleToggleMaximized();
        });

        expect(mockIPC.switchWindowSize).toHaveBeenCalled();
        expect(result.current.isMaximized).toBe(true);
    });

    it("should close window", () => {
        const { result } = renderHook(() => useWindowOperations());

        act(() => {
            result.current.handleCloseWindow();
        });

        expect(mockIPC.closeWindow).toHaveBeenCalled();
    });
});

