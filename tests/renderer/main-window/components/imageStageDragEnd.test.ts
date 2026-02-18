import { describe, expect, it, vi } from "vitest";
import { bindStageDragEndDisable } from "@/renderer/main-window/components/imageStageDragEnd";

describe("bindStageDragEndDisable", () => {
    it("registers dragend listener and cleans it up", () => {
        const on = vi.fn();
        const off = vi.fn();
        const draggable = vi.fn();

        const stage = {
            on,
            off,
            draggable,
        } as unknown as {
            on: (event: string, handler: () => void) => void;
            off: (event: string, handler: () => void) => void;
            draggable: (value: boolean) => void;
        };

        const cleanup = bindStageDragEndDisable(stage as never);

        expect(on).toHaveBeenCalledTimes(1);
        expect(on).toHaveBeenCalledWith("dragend", expect.any(Function));

        const dragEndHandler = on.mock.calls[0][1] as () => void;
        dragEndHandler();

        expect(draggable).toHaveBeenCalledWith(false);

        cleanup();

        expect(off).toHaveBeenCalledWith("dragend", dragEndHandler);
    });
});
