/**
 * @vitest-environment happy-dom
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";

import { useProjectDataSyncBridge } from "@/renderer/hooks/useProjectDataSyncBridge";
import { useAppStore } from "@/renderer/store/useAppStore";

const mockIPC = vi.hoisted(() => ({
    updateImageSets: vi.fn().mockResolvedValue(undefined),
    updateDimensionLines: vi.fn().mockResolvedValue(undefined),
    updateUnitFactor: vi.fn().mockResolvedValue(undefined),
    updateUnit: vi.fn().mockResolvedValue(undefined),
    updateSelectedImageId: vi.fn().mockResolvedValue(undefined),
    updateSelectedDimensionLineId: vi.fn().mockResolvedValue(undefined),
    updateInteractionMode: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/renderer/services/ipcService", () => ({
    getIPCService: () => mockIPC,
}));

describe("useProjectDataSyncBridge", () => {
    beforeEach(() => {
        useAppStore.getState().resetAll();
        vi.clearAllMocks();
    });

    it("broadcasts local project data changes", () => {
        renderHook(() => useProjectDataSyncBridge());

        act(() => {
            useAppStore.getState().setUnitFactor(2.5);
            useAppStore.getState().setUnit("mm");
            useAppStore.getState().setImageSets([
                {
                    id: "img-1",
                    path: "local-file:///tmp/a.png",
                    transparency: 0,
                    rotation: 0,
                    initAnchorPos: null,
                    currentAnchorPos: null,
                    locked: false,
                },
            ]);
            useAppStore.getState().setDimensionLines([
                {
                    id: "line-1",
                    start: { x: 0, y: 0 },
                    end: { x: 10, y: 0 },
                },
            ]);
        });

        expect(mockIPC.updateUnitFactor).toHaveBeenCalledWith(2.5);
        expect(mockIPC.updateUnit).toHaveBeenCalledWith("mm");
        expect(mockIPC.updateImageSets).toHaveBeenCalledTimes(1);
        expect(mockIPC.updateDimensionLines).toHaveBeenCalledTimes(1);
    });

    it("does not re-broadcast remote synced changes", () => {
        renderHook(() => useProjectDataSyncBridge());

        act(() => {
            useAppStore.getState().syncUnitFactor(3.2);
            useAppStore.getState().syncUnit("nm");
            useAppStore.getState().syncImageSets([
                {
                    id: "img-2",
                    path: "local-file:///tmp/b.png",
                    transparency: 0,
                    rotation: 0,
                    initAnchorPos: null,
                    currentAnchorPos: null,
                    locked: false,
                },
            ]);
            useAppStore.getState().receiveDimensionLines([
                {
                    id: "line-2",
                    start: { x: 1, y: 1 },
                    end: { x: 20, y: 1 },
                },
            ]);
        });

        expect(mockIPC.updateUnitFactor).not.toHaveBeenCalled();
        expect(mockIPC.updateUnit).not.toHaveBeenCalled();
        expect(mockIPC.updateImageSets).not.toHaveBeenCalled();
        expect(mockIPC.updateDimensionLines).not.toHaveBeenCalled();
    });
});

