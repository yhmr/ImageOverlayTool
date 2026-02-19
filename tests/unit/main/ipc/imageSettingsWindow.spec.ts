import { beforeEach, describe, expect, it, vi } from "vitest";
import fs from "fs/promises";
import { BrowserWindow, clipboard, dialog, ipcMain, nativeImage } from "electron";

import { registerImageSettingsWindowHandlers } from "@/main/ipc/imageSettingsWindow";
import { IPC_CHANNELS, IPC_EVENTS } from "@/shared/ipc/channels";
import { invokeIpcHandler } from "../utils/ipcTestHelper";

const {
    mockSaveClipboardImageToCache,
    mockIsManagedClipboardCachePath,
    mockDeleteClipboardCacheFileIfManaged,
} = vi.hoisted(() => ({
    mockSaveClipboardImageToCache: vi.fn(),
    mockIsManagedClipboardCachePath: vi.fn(),
    mockDeleteClipboardCacheFileIfManaged: vi.fn(),
}));

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

vi.mock("@/main/services/clipboardCacheService", () => ({
    saveClipboardImageToCache: mockSaveClipboardImageToCache,
    isManagedClipboardCachePath: mockIsManagedClipboardCachePath,
    deleteClipboardCacheFileIfManaged: mockDeleteClipboardCacheFileIfManaged,
}));

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
        toggleDimensionSettingsWindow: vi.fn(() => true),
        getAllWindows: vi.fn((): any[] => []),
        setProjectDirty: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockSaveClipboardImageToCache.mockReset();
        mockIsManagedClipboardCachePath.mockReset();
        mockDeleteClipboardCacheFileIfManaged.mockReset();
        mockIsManagedClipboardCachePath.mockReturnValue(true);
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
        expect(ipcMain.handle).toHaveBeenCalledWith(
            IPC_CHANNELS.dimensionSettingsWindow.toggle,
            expect.any(Function)
        );
    });

    it("sync update handlers send events to windows except sender", async () => {
        const senderWindow = { webContents: { id: 11, send: vi.fn() } };
        const targetWindow = { webContents: { id: 22, send: vi.fn() } };
        windowManagerMock.getAllWindows.mockReturnValue([
            senderWindow,
            targetWindow,
        ]);

        await invokeIpcHandler(
            IPC_CHANNELS.sync.updateImageSets,
            { sender: { id: 11 } },
            [{ id: "img-1" }]
        );

        expect(senderWindow.webContents.send).not.toHaveBeenCalled();
        expect(targetWindow.webContents.send).toHaveBeenCalledWith(
            IPC_EVENTS.imageSetsUpdated,
            [{ id: "img-1" }]
        );
    });

    it("toggle handlers forward visibility state from windowManager", async () => {
        windowManagerMock.toggleImageSettingsWindow.mockReturnValueOnce(false);
        windowManagerMock.toggleDimensionSettingsWindow.mockReturnValueOnce(true);

        const imageSettingsVisible = await invokeIpcHandler(
            IPC_CHANNELS.imageSettingsWindow.toggle
        );
        const dimensionSettingsVisible = await invokeIpcHandler(
            IPC_CHANNELS.dimensionSettingsWindow.toggle
        );

        expect(imageSettingsVisible).toBe(false);
        expect(dimensionSettingsVisible).toBe(true);
    });

    it("sync handlers for unit and selection channels target non-sender windows only", async () => {
        const senderWindow = { webContents: { id: 100, send: vi.fn() } };
        const targetWindow = { webContents: { id: 200, send: vi.fn() } };
        windowManagerMock.getAllWindows.mockReturnValue([
            senderWindow,
            targetWindow,
        ]);

        await invokeIpcHandler(
            IPC_CHANNELS.sync.updateDimensionLines,
            { sender: { id: 100 } },
            [{ id: "line-1" }]
        );
        await invokeIpcHandler(
            IPC_CHANNELS.sync.updateUnitFactor,
            { sender: { id: 100 } },
            0.5
        );
        await invokeIpcHandler(
            IPC_CHANNELS.sync.updateUnit,
            { sender: { id: 100 } },
            "mm"
        );
        await invokeIpcHandler(
            IPC_CHANNELS.sync.updateInteractionMode,
            { sender: { id: 100 } },
            "dimension_add"
        );
        await invokeIpcHandler(
            IPC_CHANNELS.sync.updateSelectedImageId,
            { sender: { id: 100 } },
            "img-2"
        );
        await invokeIpcHandler(
            IPC_CHANNELS.sync.updateSelectedDimensionLineId,
            { sender: { id: 100 } },
            "line-2"
        );

        expect(senderWindow.webContents.send).not.toHaveBeenCalled();
        expect(targetWindow.webContents.send).toHaveBeenCalledWith(
            IPC_EVENTS.dimensionLinesUpdated,
            [{ id: "line-1" }]
        );
        expect(targetWindow.webContents.send).toHaveBeenCalledWith(
            IPC_EVENTS.unitFactorUpdated,
            0.5
        );
        expect(targetWindow.webContents.send).toHaveBeenCalledWith(
            IPC_EVENTS.unitUpdated,
            "mm"
        );
        expect(targetWindow.webContents.send).toHaveBeenCalledWith(
            IPC_EVENTS.interactionModeUpdated,
            "dimension_add"
        );
        expect(targetWindow.webContents.send).toHaveBeenCalledWith(
            IPC_EVENTS.selectedImageIdUpdated,
            "img-2"
        );
        expect(targetWindow.webContents.send).toHaveBeenCalledWith(
            IPC_EVENTS.selectedDimensionLineIdUpdated,
            "line-2"
        );
    });

    it("requestInitialState and updateProjectDirty handlers propagate expected effects", async () => {
        const senderWindow = { webContents: { id: 1, send: vi.fn() } };
        const otherWindow = { webContents: { id: 2, send: vi.fn() } };
        windowManagerMock.getAllWindows.mockReturnValue([
            senderWindow,
            otherWindow,
        ]);

        await invokeIpcHandler(
            IPC_CHANNELS.sync.requestInitialState,
            { sender: { id: 1 } }
        );
        await invokeIpcHandler(IPC_CHANNELS.sync.updateProjectDirty, {}, 1);

        expect(otherWindow.webContents.send).toHaveBeenCalledWith(
            IPC_EVENTS.requestStateSync
        );
        expect(windowManagerMock.setProjectDirty).toHaveBeenCalledWith(true);
    });

    it("returns exists and dimensions for existing local-file path", async () => {
        const result = await invokeIpcHandler(
            IPC_CHANNELS.imageSettingsWindow.getImageInfo,
            {},
            "local-file://C:/tmp/example.png"
        );

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

    it("returns not exists for non-string path input", async () => {
        const result = await invokeIpcHandler(
            IPC_CHANNELS.imageSettingsWindow.getImageInfo,
            {},
            null as any
        );

        expect(fs.access).not.toHaveBeenCalled();
        expect(result).toEqual({ exists: false });
    });

    it("resolves local-file windows path formats with and without drive colon", async () => {
        const fromLeadingSlash = await invokeIpcHandler(
            IPC_CHANNELS.imageSettingsWindow.getImageInfo,
            {},
            "local-file:///C:/tmp/from-leading-slash.png"
        );
        expect(fromLeadingSlash).toEqual({
            exists: true,
            width: 640,
            height: 480,
        });

        const fromColonlessDrive = await invokeIpcHandler(
            IPC_CHANNELS.imageSettingsWindow.getImageInfo,
            {},
            "local-file://c/tmp/from-colonless-drive.png"
        );
        expect(fromColonlessDrive).toEqual({
            exists: true,
            width: 640,
            height: 480,
        });
    });

    it("returns not exists for non-absolute local-file path", async () => {
        const result = await invokeIpcHandler(
            IPC_CHANNELS.imageSettingsWindow.getImageInfo,
            {},
            "local-file://relative/path.png"
        );

        expect(result).toEqual({ exists: false });
    });

    it("returns exists only when image decode result is empty", async () => {
        vi.mocked(nativeImage.createFromPath).mockReturnValue({
            isEmpty: () => true,
        } as any);

        const result = await invokeIpcHandler(
            IPC_CHANNELS.imageSettingsWindow.getImageInfo,
            {},
            "C:/tmp/empty.png"
        );

        expect(result).toEqual({ exists: true });
    });

    it("returns exists only when width or height is zero", async () => {
        vi.mocked(nativeImage.createFromPath).mockReturnValue({
            isEmpty: () => false,
            getSize: () => ({ width: 0, height: 20 }),
        } as any);

        const result = await invokeIpcHandler(
            IPC_CHANNELS.imageSettingsWindow.getImageInfo,
            {},
            "C:/tmp/zero-size.png"
        );

        expect(result).toEqual({ exists: true });
    });

    it("loadImage returns undefined when owner window is unavailable", async () => {
        vi.mocked(BrowserWindow.fromWebContents).mockReturnValue(null);

        const result = await invokeIpcHandler(
            IPC_CHANNELS.imageSettingsWindow.loadImage,
            { sender: {} }
        );

        expect(result).toBeUndefined();
        expect(dialog.showOpenDialog).not.toHaveBeenCalled();
    });

    it("loadImage returns undefined when user cancels open dialog", async () => {
        vi.mocked(BrowserWindow.fromWebContents).mockReturnValue({} as any);
        vi.mocked(dialog.showOpenDialog).mockResolvedValue({
            canceled: true,
            filePaths: [],
        });

        const result = await invokeIpcHandler(
            IPC_CHANNELS.imageSettingsWindow.loadImage,
            { sender: {} }
        );

        expect(result).toBeUndefined();
    });

    it("loadImage returns selected path", async () => {
        vi.mocked(BrowserWindow.fromWebContents).mockReturnValue({} as any);
        vi.mocked(dialog.showOpenDialog).mockResolvedValue({
            canceled: false,
            filePaths: ["C:/tmp/opened.png"],
        });

        const result = await invokeIpcHandler(
            IPC_CHANNELS.imageSettingsWindow.loadImage,
            { sender: {} }
        );

        expect(result).toBe("C:/tmp/opened.png");
    });

    it("loadImage rethrows showOpenDialog errors", async () => {
        vi.mocked(BrowserWindow.fromWebContents).mockReturnValue({} as any);
        vi.mocked(dialog.showOpenDialog).mockRejectedValue(new Error("open failed"));

        await expect(
            invokeIpcHandler(IPC_CHANNELS.imageSettingsWindow.loadImage, {
                sender: {},
            })
        ).rejects.toThrow("open failed");
    });

    it("pasteImage returns null when clipboard has no image", async () => {
        vi.mocked(clipboard.readImage).mockReturnValue({
            isEmpty: () => true,
        } as any);

        const result = await invokeIpcHandler(
            IPC_CHANNELS.imageSettingsWindow.pasteImage,
            {}
        );

        expect(result).toBeNull();
        expect(mockSaveClipboardImageToCache).not.toHaveBeenCalled();
    });

    it("pasteImage returns cached path when save succeeds", async () => {
        vi.mocked(clipboard.readImage).mockReturnValue({
            isEmpty: () => false,
        } as any);
        mockSaveClipboardImageToCache.mockResolvedValue("C:/tmp/cache.png");

        const result = await invokeIpcHandler(
            IPC_CHANNELS.imageSettingsWindow.pasteImage,
            {}
        );

        expect(mockSaveClipboardImageToCache).toHaveBeenCalled();
        expect(result).toBe("C:/tmp/cache.png");
    });

    it("pasteImage rethrows errors from cache save", async () => {
        vi.mocked(clipboard.readImage).mockReturnValue({
            isEmpty: () => false,
        } as any);
        mockSaveClipboardImageToCache.mockRejectedValue(new Error("cache failed"));

        await expect(
            invokeIpcHandler(IPC_CHANNELS.imageSettingsWindow.pasteImage, {})
        ).rejects.toThrow("cache failed");
    });

    it("saveCacheImageAs returns null for unmanaged path", async () => {
        mockIsManagedClipboardCachePath.mockReturnValue(false);

        const result = await invokeIpcHandler(
            IPC_CHANNELS.imageSettingsWindow.saveCacheImageAs,
            { sender: {} },
            "C:/tmp/not-managed.png"
        );

        expect(result).toBeNull();
        expect(dialog.showSaveDialog).not.toHaveBeenCalled();
    });

    it("saveCacheImageAs returns null when save dialog is canceled", async () => {
        vi.mocked(BrowserWindow.fromWebContents).mockReturnValue({} as any);
        vi.mocked(dialog.showSaveDialog).mockResolvedValue({
            canceled: true,
            filePath: "",
        });

        const result = await invokeIpcHandler(
            IPC_CHANNELS.imageSettingsWindow.saveCacheImageAs,
            { sender: {} },
            "C:/tmp/clipboard-cache/clip.png"
        );

        expect(result).toBeNull();
        expect(fs.copyFile).not.toHaveBeenCalled();
    });

    it("saveCacheImageAs returns null when save dialog has no filePath", async () => {
        vi.mocked(BrowserWindow.fromWebContents).mockReturnValue({} as any);
        vi.mocked(dialog.showSaveDialog).mockResolvedValue({
            canceled: false,
            filePath: "",
        });

        const result = await invokeIpcHandler(
            IPC_CHANNELS.imageSettingsWindow.saveCacheImageAs,
            { sender: {} },
            "C:/tmp/clipboard-cache/clip.png"
        );

        expect(result).toBeNull();
        expect(fs.copyFile).not.toHaveBeenCalled();
    });

    it("saveCacheImageAs copies file and deletes cache after save", async () => {
        const ownerWindow = {};
        vi.mocked(BrowserWindow.fromWebContents).mockReturnValue(ownerWindow as any);
        vi.mocked(dialog.showSaveDialog).mockResolvedValue({
            canceled: false,
            filePath: "C:/tmp/exported.png",
        });

        const result = await invokeIpcHandler(
            IPC_CHANNELS.imageSettingsWindow.saveCacheImageAs,
            { sender: {} },
            "C:/tmp/clipboard-cache/clip.png"
        );

        expect(dialog.showSaveDialog).toHaveBeenCalledWith(
            ownerWindow,
            expect.objectContaining({
                title: "Save Image",
                defaultPath: "clip.png",
            })
        );
        expect(fs.copyFile).toHaveBeenCalledWith(
            "C:/tmp/clipboard-cache/clip.png",
            "C:/tmp/exported.png"
        );
        expect(mockDeleteClipboardCacheFileIfManaged).toHaveBeenCalledWith(
            "C:/tmp/clipboard-cache/clip.png"
        );
        expect(result).toBe("C:/tmp/exported.png");
    });

    it("saveCacheImageAs uses global dialog when owner window is unavailable", async () => {
        vi.mocked(BrowserWindow.fromWebContents).mockReturnValue(null);
        vi.mocked(dialog.showSaveDialog).mockResolvedValue({
            canceled: false,
            filePath: "C:/tmp/exported.png",
        });

        await invokeIpcHandler(
            IPC_CHANNELS.imageSettingsWindow.saveCacheImageAs,
            { sender: {} },
            "C:/tmp/clipboard-cache/clip.png"
        );

        expect(dialog.showSaveDialog).toHaveBeenCalledWith(
            expect.objectContaining({
                title: "Save Image",
                defaultPath: "clip.png",
            })
        );
    });

    it("saveCacheImageAs falls back to default file name when cache path lacks basename/extension", async () => {
        vi.mocked(BrowserWindow.fromWebContents).mockReturnValue(null);
        vi.mocked(dialog.showSaveDialog).mockResolvedValue({
            canceled: true,
            filePath: "",
        });

        await invokeIpcHandler(
            IPC_CHANNELS.imageSettingsWindow.saveCacheImageAs,
            { sender: {} },
            "C:/"
        );

        expect(dialog.showSaveDialog).toHaveBeenCalledWith(
            expect.objectContaining({
                defaultPath: "pasted-image.png",
            })
        );
    });

    it("saveCacheImageAs rethrows copy failures", async () => {
        vi.mocked(BrowserWindow.fromWebContents).mockReturnValue({} as any);
        vi.mocked(dialog.showSaveDialog).mockResolvedValue({
            canceled: false,
            filePath: "C:/tmp/exported.png",
        });
        vi.mocked(fs.copyFile).mockRejectedValue(new Error("copy failed"));

        await expect(
            invokeIpcHandler(
                IPC_CHANNELS.imageSettingsWindow.saveCacheImageAs,
                { sender: {} },
                "C:/tmp/clipboard-cache/clip.png"
            )
        ).rejects.toThrow("copy failed");
    });
});
