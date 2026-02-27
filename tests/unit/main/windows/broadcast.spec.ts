import { describe, expect, it, vi } from "vitest";
import type { BrowserWindow } from "electron";

import {
    broadcastToAllWindows,
    broadcastToOtherWindows,
} from "@/main/windows/broadcast";

const asBrowserWindow = (
    value: Partial<BrowserWindow>
): BrowserWindow => value as BrowserWindow;

const createWindow = (id: number) => {
    const send = vi.fn();
    const win = asBrowserWindow({
        webContents: {
            id,
            send,
        } as unknown as BrowserWindow["webContents"],
    });

    return { win, send };
};

describe("windows/broadcast", () => {
    it("broadcastToAllWindows sends event to every window", () => {
        const first = createWindow(1);
        const second = createWindow(2);

        broadcastToAllWindows(
            [first.win, second.win],
            "test:event",
            "payload",
            42
        );

        expect(first.send).toHaveBeenCalledWith("test:event", "payload", 42);
        expect(second.send).toHaveBeenCalledWith("test:event", "payload", 42);
    });

    it("broadcastToOtherWindows skips sender window", () => {
        const sender = createWindow(10);
        const target = createWindow(20);

        broadcastToOtherWindows(
            {
                getAllWindows: () => [sender.win, target.win],
            },
            10,
            "sync:event",
            { id: "x" }
        );

        expect(sender.send).not.toHaveBeenCalled();
        expect(target.send).toHaveBeenCalledWith("sync:event", { id: "x" });
    });
});
