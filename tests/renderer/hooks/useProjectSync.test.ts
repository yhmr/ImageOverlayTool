/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useProjectSync } from "@/renderer/hooks/useProjectSync";
import { useAppStore } from "@/renderer/store/useAppStore";
import { ImageSet } from "@/shared/types/ImageSet";
import { DimensionLine } from "@/shared/types/DimensionLine";

const callbacks = vi.hoisted(() => ({
    unitFactor: null as ((factor: number) => void) | null,
    unit: null as ((unit: "nm" | "um" | "mm") => void) | null,
    imageSets: null as ((imageSets: ImageSet[]) => void) | null,
    dimensionLines: null as ((dimensionLines: DimensionLine[]) => void) | null,
    interactionMode: null as ((mode: "default" | "dimension") => void) | null,
    selectedImageId: null as ((id: string | null) => void) | null,
    requestSync: null as (() => void) | null,
}));

const unsubscribers = vi.hoisted(() => ({
    unitFactor: vi.fn(),
    unit: vi.fn(),
    imageSets: vi.fn(),
    dimensionLines: vi.fn(),
    interactionMode: vi.fn(),
    selectedImageId: vi.fn(),
    requestSync: vi.fn(),
}));

const mockIPC = vi.hoisted(() => ({
    onUnitFactorUpdated: vi.fn((cb: (factor: number) => void) => {
        callbacks.unitFactor = cb;
        return unsubscribers.unitFactor;
    }),
    onUnitUpdated: vi.fn((cb: (unit: "nm" | "um" | "mm") => void) => {
        callbacks.unit = cb;
        return unsubscribers.unit;
    }),
    onImageSetsUpdated: vi.fn((cb: (imageSets: ImageSet[]) => void) => {
        callbacks.imageSets = cb;
        return unsubscribers.imageSets;
    }),
    onDimensionLinesUpdated: vi.fn(
        (cb: (dimensionLines: DimensionLine[]) => void) => {
            callbacks.dimensionLines = cb;
            return unsubscribers.dimensionLines;
        }
    ),
    onInteractionModeUpdated: vi.fn(
        (cb: (mode: "default" | "dimension") => void) => {
            callbacks.interactionMode = cb;
            return unsubscribers.interactionMode;
        }
    ),
    onSelectedImageIdUpdated: vi.fn((cb: (id: string | null) => void) => {
        callbacks.selectedImageId = cb;
        return unsubscribers.selectedImageId;
    }),
    onRequestStateSync: vi.fn((cb: () => void) => {
        callbacks.requestSync = cb;
        return unsubscribers.requestSync;
    }),
    updateImageSets: vi.fn(),
    updateDimensionLines: vi.fn(),
    updateUnitFactor: vi.fn(),
    updateUnit: vi.fn(),
    updateInteractionMode: vi.fn(),
}));

vi.mock("@/renderer/services/ipcService", () => ({
    getIPCService: () => mockIPC,
}));

describe("useProjectSync", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        callbacks.unitFactor = null;
        callbacks.unit = null;
        callbacks.imageSets = null;
        callbacks.dimensionLines = null;
        callbacks.interactionMode = null;
        callbacks.selectedImageId = null;
        callbacks.requestSync = null;
        useAppStore.getState().resetAll();
    });

    it("should sync unitFactor when receiving unitFactor update event", () => {
        renderHook(() => useProjectSync());

        expect(callbacks.unitFactor).toBeTypeOf("function");

        act(() => {
            callbacks.unitFactor?.(2.5);
        });

        expect(useAppStore.getState().unitFactor).toBe(2.5);
    });

    it("should include unitFactor when responding to state:requestSync", () => {
        const imageSets: ImageSet[] = [
            {
                id: "img-1",
                path: "local-file:///tmp/test.png",
                transparency: 0,
                rotation: 0,
                initAnchorPos: null,
                currentAnchorPos: null,
            },
        ];

        act(() => {
            useAppStore.setState({
                imageSets,
                unitFactor: 3.2,
                unit: "mm",
            });
        });

        renderHook(() => useProjectSync());

        act(() => {
            callbacks.requestSync?.();
        });

        expect(mockIPC.updateImageSets).toHaveBeenCalledWith(imageSets);
        expect(mockIPC.updateDimensionLines).toHaveBeenCalledWith([]);
        expect(mockIPC.updateUnitFactor).toHaveBeenCalledWith(3.2);
        expect(mockIPC.updateUnit).toHaveBeenCalledWith("mm");
        expect(mockIPC.updateInteractionMode).toHaveBeenCalledWith("default");
    });

    it("should unsubscribe all IPC listeners on unmount", () => {
        const { unmount } = renderHook(() => useProjectSync());

        unmount();

        expect(unsubscribers.unitFactor).toHaveBeenCalledTimes(1);
        expect(unsubscribers.unit).toHaveBeenCalledTimes(1);
        expect(unsubscribers.imageSets).toHaveBeenCalledTimes(1);
        expect(unsubscribers.dimensionLines).toHaveBeenCalledTimes(1);
        expect(unsubscribers.interactionMode).toHaveBeenCalledTimes(1);
        expect(unsubscribers.selectedImageId).toHaveBeenCalledTimes(1);
        expect(unsubscribers.requestSync).toHaveBeenCalledTimes(1);
    });
});
