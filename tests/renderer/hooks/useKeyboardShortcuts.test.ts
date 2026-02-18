/**
 * @vitest-environment happy-dom
 */
import { act, renderHook } from "@testing-library/react";
import { createImageSet } from "@/renderer/factories/imageSetFactory";
import { useKeyboardShortcuts } from "@/renderer/hooks/useKeyboardShortcuts";
import { useAppStore } from "@/renderer/store/useAppStore";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("useKeyboardShortcuts", () => {
    beforeEach(() => {
        useAppStore.getState().resetAll();

        const anchors = {
            lt: { x: 0, y: 0 },
            rt: { x: 100, y: 0 },
            rb: { x: 100, y: 100 },
            lb: { x: 0, y: 100 },
        };
        const imageSet = createImageSet({
            path: "local-file://dummy.png",
            initAnchorPos: anchors,
            currentAnchorPos: anchors,
        });

        useAppStore.setState({
            imageSets: [imageSet],
            selectedImageId: imageSet.id,
            canvas: { x: 0, y: 0, scale: 1 },
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("applies fit-to-screen on Ctrl+F", () => {
        const container = document.createElement("div");
        vi.spyOn(container, "offsetWidth", "get").mockReturnValue(400);
        vi.spyOn(container, "offsetHeight", "get").mockReturnValue(300);
        vi.spyOn(document, "querySelector").mockReturnValue(container);

        renderHook(() => useKeyboardShortcuts());

        const preventDefault = vi.fn();

        act(() => {
            const event = new KeyboardEvent("keydown", {
                key: "f",
                ctrlKey: true,
            });
            Object.defineProperty(event, "preventDefault", {
                value: preventDefault,
            });
            window.dispatchEvent(event);
        });

        const state = useAppStore.getState();
        expect(preventDefault).toHaveBeenCalledTimes(1);
        expect(state.canvas.scale).toBeCloseTo(2.85, 5);
        expect(state.canvas.x).toBeCloseTo(57.5, 5);
        expect(state.canvas.y).toBeCloseTo(7.5, 5);
        expect(state.selectedImageId).toBeNull();
    });

    it("calls new project handler on Ctrl+N", () => {
        const onNewProject = vi.fn();
        renderHook(() => useKeyboardShortcuts({ onNewProject }));

        const preventDefault = vi.fn();

        act(() => {
            const event = new KeyboardEvent("keydown", {
                key: "n",
                ctrlKey: true,
            });
            Object.defineProperty(event, "preventDefault", {
                value: preventDefault,
            });
            window.dispatchEvent(event);
        });

        expect(preventDefault).toHaveBeenCalledTimes(1);
        expect(onNewProject).toHaveBeenCalledTimes(1);
    });

    it("calls click-through toggle handler on Ctrl+Shift+M", () => {
        const onToggleClickThroughMode = vi.fn();
        renderHook(() =>
            useKeyboardShortcuts({ onToggleClickThroughMode })
        );

        const preventDefault = vi.fn();

        act(() => {
            const event = new KeyboardEvent("keydown", {
                key: "m",
                ctrlKey: true,
                shiftKey: true,
            });
            Object.defineProperty(event, "preventDefault", {
                value: preventDefault,
            });
            window.dispatchEvent(event);
        });

        expect(preventDefault).toHaveBeenCalledTimes(1);
        expect(onToggleClickThroughMode).toHaveBeenCalledTimes(1);
    });
});
