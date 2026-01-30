/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useDimensionKeyboard } from "@/renderer/hooks/useDimensionKeyboard";
import { useAppStore } from "@/renderer/store/useAppStore";

// Mock Electron API
window.electronAPI = {
    updateImageSets: vi.fn(),
    updateUnitFactor: vi.fn(),
} as any;

describe("useDimensionKeyboard", () => {
    beforeEach(() => {
        useAppStore.getState().resetAll();
        vi.clearAllMocks();
    });

    afterEach(() => {
        // Ensure cleanup of event listeners
    });

    it("should delete selected dimension line on Delete key", () => {
        // Setup: Add a dimension line and select it
        const lineId = "test-line-1";
        useAppStore.setState({
            dimensionLines: [
                { id: lineId, start: { x: 0, y: 0 }, end: { x: 100, y: 100 } },
            ],
            selectedDimensionLineId: lineId,
        });

        // Render the hook
        renderHook(() => useDimensionKeyboard());

        // Simulate Delete key press
        const event = new KeyboardEvent("keydown", { key: "Delete" });
        window.dispatchEvent(event);

        // Verify line was deleted
        expect(useAppStore.getState().dimensionLines).toHaveLength(0);
        expect(useAppStore.getState().selectedDimensionLineId).toBeNull();
    });

    it("should delete selected dimension line on Backspace key", () => {
        // Setup: Add a dimension line and select it
        const lineId = "test-line-2";
        useAppStore.setState({
            dimensionLines: [
                { id: lineId, start: { x: 0, y: 0 }, end: { x: 50, y: 50 } },
            ],
            selectedDimensionLineId: lineId,
        });

        // Render the hook
        renderHook(() => useDimensionKeyboard());

        // Simulate Backspace key press
        const event = new KeyboardEvent("keydown", { key: "Backspace" });
        window.dispatchEvent(event);

        // Verify line was deleted
        expect(useAppStore.getState().dimensionLines).toHaveLength(0);
        expect(useAppStore.getState().selectedDimensionLineId).toBeNull();
    });

    it("should not delete anything when no line is selected", () => {
        // Setup: Add a dimension line but don't select it
        useAppStore.setState({
            dimensionLines: [
                {
                    id: "line-1",
                    start: { x: 0, y: 0 },
                    end: { x: 100, y: 100 },
                },
            ],
            selectedDimensionLineId: null,
        });

        // Render the hook
        renderHook(() => useDimensionKeyboard());

        // Simulate Delete key press
        const event = new KeyboardEvent("keydown", { key: "Delete" });
        window.dispatchEvent(event);

        // Verify line was NOT deleted
        expect(useAppStore.getState().dimensionLines).toHaveLength(1);
    });

    it("should ignore other keys", () => {
        // Setup: Add a selected dimension line
        const lineId = "test-line-3";
        useAppStore.setState({
            dimensionLines: [
                { id: lineId, start: { x: 0, y: 0 }, end: { x: 100, y: 100 } },
            ],
            selectedDimensionLineId: lineId,
        });

        // Render the hook
        renderHook(() => useDimensionKeyboard());

        // Simulate other key press
        const event = new KeyboardEvent("keydown", { key: "Escape" });
        window.dispatchEvent(event);

        // Verify line was NOT deleted
        expect(useAppStore.getState().dimensionLines).toHaveLength(1);
        expect(useAppStore.getState().selectedDimensionLineId).toBe(lineId);
    });
});

