import { beforeEach, describe, expect, it, vi } from "vitest";
import fs from "fs/promises";
import { BrowserWindow, clipboard, dialog, nativeImage } from "electron";

import { registerImageSettingsWindowHandlers } from "@/main/ipc/imageSettingsWindow";
import { IPC_CHANNELS, IPC_EVENTS } from "@/shared/ipc/channels";
import { invokeIpcHandler } from "../../support/helpers/ipcTestHelper";

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
    type WindowManager = Parameters<typeof registerImageSettingsWindowHandlers>[0];
    type NativeImageLike = {
        isEmpty: () => boolean;
        getSize: () => { width: number; height: number };
    };

    const asBrowserWindow = (
        value: Partial<BrowserWindow>
    ): BrowserWindow => value as unknown as BrowserWindow;

    const createWindowWithSender = (
        id: number,
        send = vi.fn()
    ): BrowserWindow =>
        asBrowserWindow({
            webContents: {
                id,
                send,
            } as unknown as BrowserWindow["webContents"],
        });

    const asNativeImage = (
        value: NativeImageLike
    ): ReturnType<typeof nativeImage.createFromPath> =>
        value as unknown as ReturnType<typeof nativeImage.createFromPath>;

    const toggleImageSettingsWindowMock = vi.fn<() => boolean>(() => true);
    const toggleDimensionSettingsWindowMock = vi.fn<() => boolean>(() => true);
    const getAllWindowsMock = vi.fn<() => BrowserWindow[]>(() => []);
    const setProjectDirtyMock = vi.fn<(value: boolean) => void>();

    const windowManagerMock: WindowManager = {
        toggleImageSettingsWindow: toggleImageSettingsWindowMock,
        toggleDimensionSettingsWindow: toggleDimensionSettingsWindowMock,
        getAllWindows: getAllWindowsMock,
        setProjectDirty: setProjectDirtyMock,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockSaveClipboardImageToCache.mockReset();
        mockIsManagedClipboardCachePath.mockReset();
        mockDeleteClipboardCacheFileIfManaged.mockReset();
        mockIsManagedClipboardCachePath.mockReturnValue(true);
        registerImageSettingsWindowHandlers(windowManagerMock);
        vi.mocked(fs.access).mockResolvedValue(undefined);
        vi.mocked(nativeImage.createFromPath).mockReturnValue(
            asNativeImage({
                isEmpty: () => false,
                getSize: () => ({ width: 640, height: 480 }),
            })
        );
    });

    it("sync update handlers send events to windows except sender", async () => {
        const senderWindow = createWindowWithSender(11);
        const targetWindow = createWindowWithSender(22);
        getAllWindowsMock.mockReturnValue([
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
        toggleImageSettingsWindowMock.mockReturnValueOnce(false);
        toggleDimensionSettingsWindowMock.mockReturnValueOnce(true);

        const imageSettingsVisible = await invokeIpcHandler(
            IPC_CHANNELS.imageSettingsWindow.toggle
        );
        const dimensionSettingsVisible = await invokeIpcHandler(
            IPC_CHANNELS.dimensionSettingsWindow.toggle
        );

        expect(imageSettingsVisible).toBe(false);
        expect(dimensionSettingsVisible).toBe(true);
    });

    it.each([
        {
            name: "dimension line updates",
            channel: IPC_CHANNELS.sync.updateDimensionLines,
            payload: [{ id: "line-1" }],
            event: IPC_EVENTS.dimensionLinesUpdated,
        },
        {
            name: "unit factor updates",
            channel: IPC_CHANNELS.sync.updateUnitFactor,
            payload: 0.5,
            event: IPC_EVENTS.unitFactorUpdated,
        },
        {
            name: "unit updates",
            channel: IPC_CHANNELS.sync.updateUnit,
            payload: "mm",
            event: IPC_EVENTS.unitUpdated,
        },
        {
            name: "interaction mode updates",
            channel: IPC_CHANNELS.sync.updateInteractionMode,
            payload: "dimension_add",
            event: IPC_EVENTS.interactionModeUpdated,
        },
        {
            name: "selected image updates",
            channel: IPC_CHANNELS.sync.updateSelectedImageId,
            payload: "img-2",
            event: IPC_EVENTS.selectedImageIdUpdated,
        },
        {
            name: "selected dimension line updates",
            channel: IPC_CHANNELS.sync.updateSelectedDimensionLineId,
            payload: "line-2",
            event: IPC_EVENTS.selectedDimensionLineIdUpdated,
        },
    ])("sync handler broadcasts only to non-sender windows: $name", async ({ channel, payload, event }) => {
        const senderWindow = createWindowWithSender(100);
        const targetWindow = createWindowWithSender(200);
        getAllWindowsMock.mockReturnValue([
            senderWindow,
            targetWindow,
        ]);

        await invokeIpcHandler(channel, { sender: { id: 100 } }, payload);

        expect(senderWindow.webContents.send).not.toHaveBeenCalled();
        expect(targetWindow.webContents.send).toHaveBeenCalledWith(event, payload);
    });

    it("requestInitialState sends requestStateSync to non-sender windows", async () => {
        const senderWindow = createWindowWithSender(1);
        const otherWindow = createWindowWithSender(2);
        getAllWindowsMock.mockReturnValue([
            senderWindow,
            otherWindow,
        ]);

        await invokeIpcHandler(
            IPC_CHANNELS.sync.requestInitialState,
            { sender: { id: 1 } }
        );

        expect(otherWindow.webContents.send).toHaveBeenCalledWith(
            IPC_EVENTS.requestStateSync
        );
        expect(senderWindow.webContents.send).not.toHaveBeenCalled();
    });

    it("updateProjectDirty forwards boolean state to windowManager", async () => {
        await invokeIpcHandler(IPC_CHANNELS.sync.updateProjectDirty, {}, 1);

        expect(setProjectDirtyMock).toHaveBeenCalledWith(true);
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
            null as unknown as string
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
        vi.mocked(nativeImage.createFromPath).mockReturnValue(
            asNativeImage({
                isEmpty: () => true,
                getSize: () => ({ width: 0, height: 0 }),
            })
        );

        const result = await invokeIpcHandler(
            IPC_CHANNELS.imageSettingsWindow.getImageInfo,
            {},
            "C:/tmp/empty.png"
        );

        expect(result).toEqual({ exists: true });
    });

    it("returns exists only when width or height is zero", async () => {
        vi.mocked(nativeImage.createFromPath).mockReturnValue(
            asNativeImage({
                isEmpty: () => false,
                getSize: () => ({ width: 0, height: 20 }),
            })
        );

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
        vi.mocked(BrowserWindow.fromWebContents).mockReturnValue(
            asBrowserWindow({})
        );
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
        vi.mocked(BrowserWindow.fromWebContents).mockReturnValue(
            asBrowserWindow({})
        );
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
        vi.mocked(BrowserWindow.fromWebContents).mockReturnValue(
            asBrowserWindow({})
        );
        vi.mocked(dialog.showOpenDialog).mockRejectedValue(new Error("open failed"));

        await expect(
            invokeIpcHandler(IPC_CHANNELS.imageSettingsWindow.loadImage, {
                sender: {},
            })
        ).rejects.toThrow("open failed");
    });

    it("pasteImage returns null when clipboard has no image", async () => {
        vi.mocked(clipboard.readImage).mockReturnValue(
            asNativeImage({
                isEmpty: () => true,
                getSize: () => ({ width: 0, height: 0 }),
            })
        );

        const result = await invokeIpcHandler(
            IPC_CHANNELS.imageSettingsWindow.pasteImage,
            {}
        );

        expect(result).toBeNull();
        expect(mockSaveClipboardImageToCache).not.toHaveBeenCalled();
    });

    it("pasteImage returns cached path when save succeeds", async () => {
        vi.mocked(clipboard.readImage).mockReturnValue(
            asNativeImage({
                isEmpty: () => false,
                getSize: () => ({ width: 100, height: 100 }),
            })
        );
        mockSaveClipboardImageToCache.mockResolvedValue("C:/tmp/cache.png");

        const result = await invokeIpcHandler(
            IPC_CHANNELS.imageSettingsWindow.pasteImage,
            {}
        );

        expect(mockSaveClipboardImageToCache).toHaveBeenCalled();
        expect(result).toBe("C:/tmp/cache.png");
    });

    it("pasteImage rethrows errors from cache save", async () => {
        vi.mocked(clipboard.readImage).mockReturnValue(
            asNativeImage({
                isEmpty: () => false,
                getSize: () => ({ width: 100, height: 100 }),
            })
        );
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
        vi.mocked(BrowserWindow.fromWebContents).mockReturnValue(
            asBrowserWindow({})
        );
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
        vi.mocked(BrowserWindow.fromWebContents).mockReturnValue(
            asBrowserWindow({})
        );
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
        const ownerWindow = asBrowserWindow({});
        vi.mocked(BrowserWindow.fromWebContents).mockReturnValue(ownerWindow);
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
        vi.mocked(BrowserWindow.fromWebContents).mockReturnValue(
            asBrowserWindow({})
        );
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

