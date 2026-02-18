import { beforeEach, describe, expect, it, vi } from "vitest";
import fs from "fs/promises";
import { ipcMain, nativeImage } from "electron";

import { registerImageSettingsWindowHandlers } from "@/main/ipc/imageSettingsWindow";
import { IPC_CHANNELS } from "@/shared/ipc/channels";
import { invokeIpcHandler } from "../utils/ipcTestHelper";

vi.mock("electron", () => ({
    ipcMain: {
        handle: vi.fn(),
    },
    dialog: {
        showOpenDialog: vi.fn(),
        showSaveDialog: vi.fn(),
    },
    BrowserWindow: {
        fromWebContents: vi.fn(),
    },
    clipboard: {
        readImage: vi.fn(),
    },
    nativeImage: {
        createFromPath: vi.fn(),
    },
    app: {
        isPackaged: false,
    },
}));

vi.mock("fs/promises");

vi.mock("@/main/logger", () => ({
    default: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}));

describe("imageSettingsWindow IPC handlers", () => {
    const windowManagerMock = {
        toggleImageSettingsWindow: vi.fn(() => true),
        getAllWindows: vi.fn(() => []),
        setProjectDirty: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        registerImageSettingsWindowHandlers(windowManagerMock as any);
        vi.mocked(fs.access).mockResolvedValue(undefined);
        vi.mocked(nativeImage.createFromPath).mockReturnValue({
            isEmpty: () => false,
            getSize: () => ({ width: 640, height: 480 }),
        } as any);
    });

    it("registers getImageInfo handler", () => {
        expect(ipcMain.handle).toHaveBeenCalledWith(
            IPC_CHANNELS.imageSettingsWindow.getImageInfo,
            expect.any(Function)
        );
    });

    it("returns exists and dimensions for existing local-file path", async () => {
        const result = await invokeIpcHandler(
            IPC_CHANNELS.imageSettingsWindow.getImageInfo,
            {},
            "local-file://C:/tmp/example.png"
        );

        expect(fs.access).toHaveBeenCalled();
        expect(
            String(vi.mocked(nativeImage.createFromPath).mock.calls[0][0])
        ).toMatch(/example\.png$/);
        expect(result).toEqual({
            exists: true,
            width: 640,
            height: 480,
        });
    });

    it("returns not exists when file access fails", async () => {
        vi.mocked(fs.access).mockRejectedValueOnce(new Error("not found"));

        const result = await invokeIpcHandler(
            IPC_CHANNELS.imageSettingsWindow.getImageInfo,
            {},
            "local-file://C:/tmp/missing.png"
        );

        expect(result).toEqual({ exists: false });
    });

    it("returns not exists for invalid path input", async () => {
        const result = await invokeIpcHandler(
            IPC_CHANNELS.imageSettingsWindow.getImageInfo,
            {},
            "not-a-valid-path"
        );

        expect(fs.access).not.toHaveBeenCalled();
        expect(result).toEqual({ exists: false });
    });
});
