import { beforeEach, describe, expect, it, vi } from "vitest";
import fs from "fs/promises";
import path from "path";
import {
    app,
    BrowserWindow,
    desktopCapturer,
    dialog,
    nativeImage,
    screen,
} from "electron";
import type {
    BrowserWindow as ElectronBrowserWindow,
    DesktopCapturerSource,
    Display,
    IpcMainInvokeEvent,
    NativeImage,
    WebContents,
} from "electron";
import {
    captureWindowAreaAndSave,
    saveDataUrlImage,
} from "@/main/services/captureService";

const { mockWarn } = vi.hoisted(() => ({
    mockWarn: vi.fn(),
}));

vi.mock("fs/promises");

vi.mock("electron", () => ({
    desktopCapturer: {
        getSources: vi.fn(),
    },
    screen: {
        getDisplayMatching: vi.fn(),
    },
    BrowserWindow: {
        fromWebContents: vi.fn(),
        getAllWindows: vi.fn(() => []),
    },
    dialog: {
        showSaveDialog: vi.fn(),
    },
    app: {
        getPath: vi.fn(() => path.join("C:", "Users", "tester", "Pictures")),
    },
    nativeImage: {
        createFromDataURL: vi.fn(),
    },
}));

vi.mock("@/main/logger", () => ({
    default: {
        warn: mockWarn,
        info: vi.fn(),
        debug: vi.fn(),
        error: vi.fn(),
    },
}));

type Rect = {
    x: number;
    y: number;
    width: number;
    height: number;
};

type MainWindowStub = {
    getBounds: () => Rect;
    isMinimized: () => boolean;
    restore: () => void;
    focus: () => void;
};

type VisibleWindowStub = {
    isVisible: () => boolean;
    hide: () => void;
    show: () => void;
};

type CroppedImageStub = {
    toPNG: () => Buffer;
    toJPEG: (quality?: number) => Buffer;
};

type ThumbnailStub = {
    crop: (bounds: Rect) => CroppedImageStub;
};

const asWebContents = (value: object = {}): WebContents =>
    value as unknown as WebContents;

const createIpcEvent = (): IpcMainInvokeEvent =>
    ({ sender: asWebContents() }) as unknown as IpcMainInvokeEvent;

const asBrowserWindow = <T extends object>(window: T): ElectronBrowserWindow =>
    window as unknown as ElectronBrowserWindow;

const asDisplay = (display: {
    id: number;
    size: { width: number; height: number };
    scaleFactor: number;
    bounds: Rect;
}): Display => display as unknown as Display;

const asSource = (source: {
    display_id: string;
    thumbnail: ThumbnailStub;
}): DesktopCapturerSource => source as unknown as DesktopCapturerSource;

const asNativeImage = (image: {
    toPNG: () => Buffer;
    toJPEG?: (quality?: number) => Buffer;
}): NativeImage => image as unknown as NativeImage;

const createCroppedImage = (
    pngBuffer = Buffer.from("cropped-png"),
    jpegBuffer = Buffer.from("cropped-jpeg")
): CroppedImageStub => ({
    toPNG: () => pngBuffer,
    toJPEG: () => jpegBuffer,
});

const createThumbnail = (cropped: CroppedImageStub): ThumbnailStub => ({
    crop: vi.fn(() => cropped),
});

const createMainWindow = (
    bounds: Rect,
    isMinimized = false
): MainWindowStub => ({
    getBounds: () => bounds,
    isMinimized: vi.fn(() => isMinimized),
    restore: vi.fn(),
    focus: vi.fn(),
});

const createVisibleWindow = (): VisibleWindowStub => ({
    isVisible: () => true,
    hide: vi.fn(),
    show: vi.fn(),
});

type CaptureContextOptions = {
    winBounds?: Rect;
    display?: {
        id: number;
        size: { width: number; height: number };
        scaleFactor: number;
        bounds: Rect;
    };
    isMinimized?: boolean;
    windows?: VisibleWindowStub[];
    sources?: Array<{
        display_id: string;
        thumbnail: ThumbnailStub;
    }>;
    saveDialogResult?: {
        canceled: boolean;
        filePath: string;
    };
};

const setupCaptureContext = (options: CaptureContextOptions = {}) => {
    const winBounds = options.winBounds ?? {
        x: 140,
        y: 90,
        width: 500,
        height: 300,
    };
    const display =
        options.display ??
        ({
            id: 1,
            size: { width: 1920, height: 1080 },
            scaleFactor: 2,
            bounds: { x: 100, y: 50, width: 1920, height: 1080 },
        } as const);
    const mainWindow = createMainWindow(winBounds, options.isMinimized ?? false);
    const windows = options.windows ?? [];
    const sources = options.sources ?? [];

    vi.mocked(BrowserWindow.fromWebContents).mockReturnValue(
        asBrowserWindow(mainWindow)
    );
    vi.mocked(BrowserWindow.getAllWindows).mockReturnValue(
        windows.map(asBrowserWindow)
    );
    vi.mocked(screen.getDisplayMatching).mockReturnValue(asDisplay(display));
    vi.mocked(desktopCapturer.getSources).mockResolvedValue(sources.map(asSource));

    if (options.saveDialogResult) {
        vi.mocked(dialog.showSaveDialog).mockResolvedValue(options.saveDialogResult);
    }

    return {
        event: createIpcEvent(),
        mainWindow,
        display,
        windows,
    };
};

describe("captureService", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(fs.mkdir).mockResolvedValue(undefined);
        vi.mocked(fs.writeFile).mockResolvedValue(undefined);
        vi.useRealTimers();
    });

    it("captureWindowAreaAndSave returns null when sender window is unavailable", async () => {
        vi.mocked(BrowserWindow.fromWebContents).mockReturnValue(null);

        const result = await captureWindowAreaAndSave(createIpcEvent(), false);

        expect(result).toBeNull();
    });

    it("captureWindowAreaAndSave captures and saves png in normal mode", async () => {
        const cropped = createCroppedImage(Buffer.from("cropped-png"));
        const thumbnail = createThumbnail(cropped);

        const { event, mainWindow } = setupCaptureContext({
            windows: [createVisibleWindow()],
            sources: [{ display_id: "1", thumbnail }],
            saveDialogResult: {
                canceled: false,
                filePath: "C:/tmp/out.png",
            },
        });

        vi.spyOn(Date, "now").mockReturnValue(123);
        const result = await captureWindowAreaAndSave(event, false);

        expect(vi.mocked(thumbnail.crop)).toHaveBeenCalledWith({
            x: 80,
            y: 80,
            width: 1000,
            height: 600,
        });
        expect(dialog.showSaveDialog).toHaveBeenCalledWith(
            asBrowserWindow(mainWindow),
            expect.objectContaining({
                defaultPath: path.join(
                    "C:",
                    "Users",
                    "tester",
                    "Pictures",
                    "capture_123.png"
                ),
            })
        );
        expect(fs.writeFile).toHaveBeenCalledWith(
            "C:/tmp/out.png",
            Buffer.from("cropped-png")
        );
        expect(result).toEqual({
            filePath: "C:/tmp/out.png",
            width: 500,
            height: 300,
        });
    });

    it("captureWindowAreaAndSave uses jpeg encoder for .jpg output", async () => {
        const jpeg = Buffer.from("jpeg");
        const cropped = createCroppedImage(Buffer.from("png"), jpeg);

        setupCaptureContext({
            winBounds: { x: 0, y: 0, width: 100, height: 80 },
            display: {
                id: 1,
                size: { width: 100, height: 80 },
                scaleFactor: 1,
                bounds: { x: 0, y: 0, width: 100, height: 80 },
            },
            sources: [
                {
                    display_id: "1",
                    thumbnail: createThumbnail(cropped),
                },
            ],
            saveDialogResult: {
                canceled: false,
                filePath: "C:/tmp/out.jpg",
            },
        });

        await captureWindowAreaAndSave(createIpcEvent(), false);

        expect(fs.writeFile).toHaveBeenCalledWith("C:/tmp/out.jpg", jpeg);
    });

    it("captureWindowAreaAndSave restores hidden windows when source lookup fails", async () => {
        const visible = createVisibleWindow();
        const { event, mainWindow } = setupCaptureContext({
            winBounds: { x: 0, y: 0, width: 100, height: 80 },
            isMinimized: true,
            windows: [visible],
            display: {
                id: 1,
                size: { width: 100, height: 80 },
                scaleFactor: 1,
                bounds: { x: 0, y: 0, width: 100, height: 80 },
            },
            sources: [],
        });

        await expect(captureWindowAreaAndSave(event, true)).rejects.toThrow(
            "No display source found for capture."
        );
        expect(visible.hide).toHaveBeenCalled();
        expect(visible.show).toHaveBeenCalled();
        expect(mainWindow.restore).toHaveBeenCalled();
        expect(mainWindow.focus).toHaveBeenCalled();
    });

    it("captureWindowAreaAndSave falls back to first source when display id cannot be matched", async () => {
        const thumbnail = createThumbnail(createCroppedImage());

        setupCaptureContext({
            winBounds: { x: 0, y: 0, width: 100, height: 80 },
            display: {
                id: 1,
                size: { width: 100, height: 80 },
                scaleFactor: 1,
                bounds: { x: 0, y: 0, width: 100, height: 80 },
            },
            sources: [
                { display_id: "9", thumbnail },
                { display_id: "10", thumbnail },
            ],
            saveDialogResult: {
                canceled: false,
                filePath: "C:/tmp/out.png",
            },
        });

        await captureWindowAreaAndSave(createIpcEvent(), false);

        expect(mockWarn).toHaveBeenCalledWith(
            "Could not match display id, using first source.",
            1,
            ["9", "10"]
        );
    });

    it("captureWindowAreaAndSave uses the only source when no display id matches", async () => {
        setupCaptureContext({
            winBounds: { x: 0, y: 0, width: 100, height: 80 },
            display: {
                id: 1,
                size: { width: 100, height: 80 },
                scaleFactor: 1,
                bounds: { x: 0, y: 0, width: 100, height: 80 },
            },
            sources: [
                {
                    display_id: "9",
                    thumbnail: createThumbnail(createCroppedImage()),
                },
            ],
            saveDialogResult: {
                canceled: false,
                filePath: "C:/tmp/out.png",
            },
        });

        const result = await captureWindowAreaAndSave(createIpcEvent(), false);

        expect(mockWarn).not.toHaveBeenCalled();
        expect(result).toEqual({
            filePath: "C:/tmp/out.png",
            width: 100,
            height: 80,
        });
    });

    it("captureWindowAreaAndSave restores windows and returns null when hide mode save is canceled", async () => {
        vi.useFakeTimers();

        const visible = createVisibleWindow();
        const { event, mainWindow } = setupCaptureContext({
            winBounds: { x: 0, y: 0, width: 100, height: 80 },
            isMinimized: true,
            windows: [visible],
            display: {
                id: 1,
                size: { width: 100, height: 80 },
                scaleFactor: 1,
                bounds: { x: 0, y: 0, width: 100, height: 80 },
            },
            sources: [
                {
                    display_id: "1",
                    thumbnail: createThumbnail(createCroppedImage()),
                },
            ],
            saveDialogResult: {
                canceled: true,
                filePath: "",
            },
        });

        const capturePromise = captureWindowAreaAndSave(event, true);
        await vi.advanceTimersByTimeAsync(300);
        const result = await capturePromise;

        expect(visible.hide).toHaveBeenCalledTimes(1);
        expect(visible.show).toHaveBeenCalledTimes(1);
        expect(mainWindow.restore).toHaveBeenCalledTimes(1);
        expect(mainWindow.focus).toHaveBeenCalledTimes(1);
        expect(result).toBeNull();
    });

    it("saveDataUrlImage returns null when sender window is unavailable", async () => {
        vi.mocked(BrowserWindow.fromWebContents).mockReturnValue(null);

        const result = await saveDataUrlImage(
            createIpcEvent(),
            "data:image/png;base64,AA=="
        );

        expect(result).toBeNull();
    });

    it("saveDataUrlImage returns null when user cancels save dialog", async () => {
        vi.mocked(BrowserWindow.fromWebContents).mockReturnValue(
            asBrowserWindow({})
        );
        vi.mocked(dialog.showSaveDialog).mockResolvedValue({
            canceled: true,
            filePath: "",
        });

        const result = await saveDataUrlImage(
            createIpcEvent(),
            "data:image/png;base64,AA=="
        );

        expect(result).toBeNull();
    });

    it("saveDataUrlImage saves selected jpeg path in normal mode", async () => {
        const ownerWindow = {};
        const jpegBuffer = Buffer.from("jpeg");
        vi.mocked(BrowserWindow.fromWebContents).mockReturnValue(
            asBrowserWindow(ownerWindow)
        );
        vi.mocked(dialog.showSaveDialog).mockResolvedValue({
            canceled: false,
            filePath: "C:/tmp/output.jpeg",
        });
        vi.mocked(nativeImage.createFromDataURL).mockReturnValue(
            asNativeImage({
                toJPEG: () => jpegBuffer,
                toPNG: () => Buffer.from("png"),
            })
        );

        const result = await saveDataUrlImage(
            createIpcEvent(),
            "data:image/png;base64,AA=="
        );

        expect(dialog.showSaveDialog).toHaveBeenCalledWith(
            asBrowserWindow(ownerWindow),
            expect.objectContaining({ title: "Save Image" })
        );
        expect(fs.writeFile).toHaveBeenCalledWith("C:/tmp/output.jpeg", jpegBuffer);
        expect(result).toBe("C:/tmp/output.jpeg");
    });

    it("saveDataUrlImage saves selected png path in normal mode", async () => {
        const pngBuffer = Buffer.from("png");
        vi.mocked(BrowserWindow.fromWebContents).mockReturnValue(
            asBrowserWindow({})
        );
        vi.mocked(dialog.showSaveDialog).mockResolvedValue({
            canceled: false,
            filePath: "C:/tmp/output.png",
        });
        vi.mocked(nativeImage.createFromDataURL).mockReturnValue(
            asNativeImage({
                toJPEG: () => Buffer.from("jpeg"),
                toPNG: () => pngBuffer,
            })
        );

        const result = await saveDataUrlImage(
            createIpcEvent(),
            "data:image/png;base64,AA=="
        );

        expect(fs.writeFile).toHaveBeenCalledWith("C:/tmp/output.png", pngBuffer);
        expect(result).toBe("C:/tmp/output.png");
    });
});
