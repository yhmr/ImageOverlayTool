/**
 * @vitest-environment happy-dom
 */
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useClickThroughMode } from "@/renderer/main-window/hooks/useClickThroughMode";
import { useAppStore } from "@/renderer/store/useAppStore";

const callbacks = vi.hoisted(() => ({
    alwaysOnTop: null as null | (() => void),
    clickThrough: null as null | (() => void),
}));

const mockIPC = vi.hoisted(() => ({
    onAlwaysOnTopShortcutTriggered: vi.fn((callback: () => void) => {
        callbacks.alwaysOnTop = callback;
        return () => {};
    }),
    onClickThroughShortcutTriggered: vi.fn((callback: () => void) => {
        callbacks.clickThrough = callback;
        return () => {};
    }),
    setAlwaysOnTop: vi.fn().mockResolvedValue(undefined),
    setIgnoreMouseEvents: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/renderer/providers/IpcServiceProvider", () => ({
    useIpcService: () => mockIPC,
}));

describe("useClickThroughMode", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        callbacks.alwaysOnTop = null;
        callbacks.clickThrough = null;
        useAppStore.getState().resetAll();
    });

    it("turns off both click-through and always-on-top when shortcut exits click-through", () => {
        renderHook(() => useClickThroughMode());
        expect(callbacks.clickThrough).toBeTypeOf("function");

        act(() => {
            callbacks.clickThrough?.();
        });
        expect(useAppStore.getState().isAlwaysOnTopMode).toBe(true);
        expect(useAppStore.getState().isClickThroughMode).toBe(true);

        act(() => {
            callbacks.clickThrough?.();
        });
        expect(useAppStore.getState().isAlwaysOnTopMode).toBe(false);
        expect(useAppStore.getState().isClickThroughMode).toBe(false);
    });
});
