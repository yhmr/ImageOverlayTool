/**
 * @vitest-environment happy-dom
 */
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createImageSet } from "@/renderer/factories/imageSetFactory";
import { useKeyboardShortcuts } from "@/renderer/hooks/useKeyboardShortcuts";
import { useAppStore } from "@/renderer/store/useAppStore";

const dispatchKey = (
    init: KeyboardEventInit,
    target: EventTarget = window
): ReturnType<typeof vi.fn> => {
    const preventDefault = vi.fn();
    act(() => {
        const event = new KeyboardEvent("keydown", {
            bubbles: true,
            ...init,
        });
        Object.defineProperty(event, "preventDefault", {
            value: preventDefault,
        });
        target.dispatchEvent(event);
    });
    return preventDefault;
};

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

        const preventDefault = dispatchKey({ key: "f", ctrlKey: true });

        expect(preventDefault).toHaveBeenCalledTimes(1);
        expect(useAppStore.getState().canvas.scale).toBeGreaterThan(1);
        expect(useAppStore.getState().selectedImageId).toBeNull();
    });

    it("handles undo/redo shortcuts and marks origin as local", () => {
        const undoSpy = vi.spyOn(useAppStore.temporal.getState(), "undo");
        const redoSpy = vi.spyOn(useAppStore.temporal.getState(), "redo");
        useAppStore.setState({ projectDataChangeOrigin: "remote" });
        renderHook(() => useKeyboardShortcuts());

        const undoPrevent = dispatchKey({ key: "z", ctrlKey: true });
        const redoYPrevent = dispatchKey({ key: "y", ctrlKey: true });
        const redoShiftZPrevent = dispatchKey({
            key: "z",
            ctrlKey: true,
            shiftKey: true,
        });

        expect(undoPrevent).toHaveBeenCalledTimes(1);
        expect(redoYPrevent).toHaveBeenCalledTimes(1);
        expect(redoShiftZPrevent).toHaveBeenCalledTimes(1);
        expect(undoSpy).toHaveBeenCalledTimes(1);
        expect(redoSpy).toHaveBeenCalledTimes(2);
        expect(useAppStore.getState().projectDataChangeOrigin).toBe("local");
    });

    it("invokes optional shortcut handlers when registered", () => {
        const handlers = {
            onNewProject: vi.fn(),
            onOpenProject: vi.fn(),
            onSaveProject: vi.fn(),
            onSaveProjectAs: vi.fn(),
            onOpenImageSettings: vi.fn(),
            onPasteImage: vi.fn(),
            onCaptureBackground: vi.fn(),
            onOpenImageExport: vi.fn(),
            onOpenDimensionSettings: vi.fn(),
            onOpenBackgroundStyle: vi.fn(),
            onToggleClickThroughMode: vi.fn(),
            onOpenSettings: vi.fn(),
            onExportLogs: vi.fn(),
            onExit: vi.fn(),
        };
        renderHook(() => useKeyboardShortcuts(handlers));

        const tests: Array<{
            init: KeyboardEventInit;
            handler: ReturnType<typeof vi.fn>;
        }> = [
            { init: { key: "n", ctrlKey: true }, handler: handlers.onNewProject },
            { init: { key: "o", metaKey: true }, handler: handlers.onOpenProject },
            { init: { key: "s", ctrlKey: true }, handler: handlers.onSaveProject },
            {
                init: { key: "s", ctrlKey: true, shiftKey: true },
                handler: handlers.onSaveProjectAs,
            },
            {
                init: { key: "i", ctrlKey: true },
                handler: handlers.onOpenImageSettings,
            },
            { init: { key: "v", ctrlKey: true }, handler: handlers.onPasteImage },
            {
                init: { key: "c", ctrlKey: true, shiftKey: true },
                handler: handlers.onCaptureBackground,
            },
            {
                init: { key: "e", ctrlKey: true },
                handler: handlers.onOpenImageExport,
            },
            {
                init: { key: "d", ctrlKey: true },
                handler: handlers.onOpenDimensionSettings,
            },
            {
                init: { key: "b", ctrlKey: true },
                handler: handlers.onOpenBackgroundStyle,
            },
            {
                init: { key: "m", ctrlKey: true, shiftKey: true },
                handler: handlers.onToggleClickThroughMode,
            },
            {
                init: { key: ",", ctrlKey: true },
                handler: handlers.onOpenSettings,
            },
            {
                init: { key: "l", ctrlKey: true, shiftKey: true },
                handler: handlers.onExportLogs,
            },
            { init: { key: "q", ctrlKey: true }, handler: handlers.onExit },
        ];

        for (const { init, handler } of tests) {
            const preventDefault = dispatchKey(init);
            expect(preventDefault).toHaveBeenCalledTimes(1);
            expect(handler).toHaveBeenCalledTimes(1);
        }
    });

    it("does not prevent default when optional handler is missing", () => {
        renderHook(() => useKeyboardShortcuts());

        const optionalOnly: KeyboardEventInit[] = [
            { key: "n", ctrlKey: true },
            { key: "o", ctrlKey: true },
            { key: "s", ctrlKey: true },
            { key: "s", ctrlKey: true, shiftKey: true },
            { key: "i", ctrlKey: true },
            { key: "v", ctrlKey: true },
            { key: "c", ctrlKey: true, shiftKey: true },
            { key: "e", ctrlKey: true },
            { key: "d", ctrlKey: true },
            { key: "b", ctrlKey: true },
            { key: "m", ctrlKey: true, shiftKey: true },
            { key: ",", ctrlKey: true },
            { key: "l", ctrlKey: true, shiftKey: true },
            { key: "q", ctrlKey: true },
        ];

        for (const init of optionalOnly) {
            const preventDefault = dispatchKey(init);
            expect(preventDefault).not.toHaveBeenCalled();
        }
    });

    it("ignores shortcuts from input/textarea/contenteditable", () => {
        const onNewProject = vi.fn();
        renderHook(() => useKeyboardShortcuts({ onNewProject }));

        const input = document.createElement("input");
        const textarea = document.createElement("textarea");
        const editable = document.createElement("div");
        editable.contentEditable = "true";

        const inputPrevent = dispatchKey({ key: "n", ctrlKey: true }, input);
        const textareaPrevent = dispatchKey(
            { key: "n", ctrlKey: true },
            textarea
        );
        const editablePrevent = dispatchKey(
            { key: "n", ctrlKey: true },
            editable
        );

        expect(onNewProject).not.toHaveBeenCalled();
        expect(inputPrevent).not.toHaveBeenCalled();
        expect(textareaPrevent).not.toHaveBeenCalled();
        expect(editablePrevent).not.toHaveBeenCalled();
    });

    it("does not match shortcuts when extra modifiers are present", () => {
        const onNewProject = vi.fn();
        renderHook(() => useKeyboardShortcuts({ onNewProject }));

        const altPrevent = dispatchKey({ key: "n", ctrlKey: true, altKey: true });
        const shiftPrevent = dispatchKey({
            key: "n",
            ctrlKey: true,
            shiftKey: true,
        });
        const noCtrlPrevent = dispatchKey({ key: "n" });

        expect(altPrevent).not.toHaveBeenCalled();
        expect(shiftPrevent).not.toHaveBeenCalled();
        expect(noCtrlPrevent).not.toHaveBeenCalled();
        expect(onNewProject).not.toHaveBeenCalled();
    });

    it("supports case-insensitive keys and meta modifiers", () => {
        const onOpenProject = vi.fn();
        renderHook(() => useKeyboardShortcuts({ onOpenProject }));

        const preventDefault = dispatchKey({ key: "O", metaKey: true });

        expect(preventDefault).toHaveBeenCalledTimes(1);
        expect(onOpenProject).toHaveBeenCalledTimes(1);
    });

    it("cleans up keydown listener on unmount", () => {
        const onNewProject = vi.fn();
        const { unmount } = renderHook(() =>
            useKeyboardShortcuts({ onNewProject })
        );
        unmount();

        const preventDefault = dispatchKey({ key: "n", ctrlKey: true });

        expect(preventDefault).not.toHaveBeenCalled();
        expect(onNewProject).not.toHaveBeenCalled();
    });
});
