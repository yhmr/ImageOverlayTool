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

describe("captureService", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(fs.mkdir).mockResolvedValue(undefined as any);
        vi.mocked(fs.writeFile).mockResolvedValue(undefined as any);
        vi.useRealTimers();
    });

    it("captureWindowAreaAndSave returns placeholder info in test mode with defaults", async () => {
        const placeholderBuffer = Buffer.from("placeholder");
        vi.mocked(nativeImage.createFromDataURL).mockReturnValue({
            toPNG: () => placeholderBuffer,
        } as any);

        const result = await captureWindowAreaAndSave(
            { sender: {} } as any,
            true,
            {
                enabled: true,
                captureFilePath: "C:/tmp/capture.png",
                exportImagePath: "C:/tmp/export.png",
            }
        );

        expect(fs.mkdir).toHaveBeenCalledWith(path.dirname("C:/tmp/capture.png"), {
            recursive: true,
        });
        expect(fs.writeFile).toHaveBeenCalledWith(
            "C:/tmp/capture.png",
            placeholderBuffer
        );
        expect(result).toEqual({
            filePath: "C:/tmp/capture.png",
            width: 1280,
            height: 720,
        });
    });

    it("captureWindowAreaAndSave uses explicit width and height in test mode", async () => {
        vi.mocked(nativeImage.createFromDataURL).mockReturnValue({
            toPNG: () => Buffer.from("placeholder"),
        } as any);

        const result = await captureWindowAreaAndSave(
            { sender: {} } as any,
            false,
            {
                enabled: true,
                captureFilePath: "C:/tmp/capture.png",
                exportImagePath: "C:/tmp/export.png",
                captureWidth: 1920,
                captureHeight: 1080,
            }
        );

        expect(result).toEqual({
            filePath: "C:/tmp/capture.png",
            width: 1920,
            height: 1080,
        });
    });

    it("captureWindowAreaAndSave returns null when sender window is unavailable", async () => {
        vi.mocked(BrowserWindow.fromWebContents).mockReturnValue(null);

        const result = await captureWindowAreaAndSave(
            { sender: {} } as any,
            false
        );

        expect(result).toBeNull();
    });

    it("captureWindowAreaAndSave captures and saves png in normal mode", async () => {
        const winBounds = { x: 140, y: 90, width: 500, height: 300 };
        const mainWindow = {
            getBounds: () => winBounds,
            isMinimized: () => false,
            restore: vi.fn(),
            focus: vi.fn(),
        };
        const display = {
            id: 1,
            size: { width: 1920, height: 1080 },
            scaleFactor: 2,
            bounds: { x: 100, y: 50, width: 1920, height: 1080 },
        };
        const toPng = Buffer.from("cropped-png");
        const cropped = {
            toPNG: () => toPng,
            toJPEG: () => Buffer.from("cropped-jpeg"),
        };
        const thumbnail = {
            crop: vi.fn(() => cropped),
        };

        vi.mocked(BrowserWindow.fromWebContents).mockReturnValue(mainWindow as any);
        vi.mocked(BrowserWindow.getAllWindows).mockReturnValue([
            { isVisible: () => true, hide: vi.fn(), show: vi.fn() },
        ] as any);
        vi.mocked(screen.getDisplayMatching).mockReturnValue(display as any);
        vi.mocked(desktopCapturer.getSources).mockResolvedValue([
            { display_id: "1", thumbnail },
        ] as any);
        vi.mocked(dialog.showSaveDialog).mockResolvedValue({
            canceled: false,
            filePath: "C:/tmp/out.png",
        });

        const result = await captureWindowAreaAndSave(
            { sender: {} } as any,
            false,
            {
                enabled: false,
                captureFilePath: "",
                exportImagePath: "",
                fixedNow: 123,
            }
        );

        expect(thumbnail.crop).toHaveBeenCalledWith({
            x: 80,
            y: 80,
            width: 1000,
            height: 600,
        });
        expect(dialog.showSaveDialog).toHaveBeenCalledWith(
            mainWindow,
            expect.objectContaining({
                defaultPath: path.join(
                    vi.mocked(app.getPath).mock.results[0].value,
                    "capture_123.png"
                ),
            })
        );
        expect(fs.writeFile).toHaveBeenCalledWith("C:/tmp/out.png", toPng);
        expect(result).toEqual({
            filePath: "C:/tmp/out.png",
            width: 500,
            height: 300,
        });
    });

    it("captureWindowAreaAndSave uses jpeg encoder for .jpg output", async () => {
        const mainWindow = {
            getBounds: () => ({ x: 0, y: 0, width: 100, height: 80 }),
            isMinimized: () => false,
            restore: vi.fn(),
            focus: vi.fn(),
        };
        const jpeg = Buffer.from("jpeg");
        const cropped = {
            toPNG: () => Buffer.from("png"),
            toJPEG: () => jpeg,
        };

        vi.mocked(BrowserWindow.fromWebContents).mockReturnValue(mainWindow as any);
        vi.mocked(BrowserWindow.getAllWindows).mockReturnValue([] as any);
        vi.mocked(screen.getDisplayMatching).mockReturnValue({
            id: 1,
            size: { width: 100, height: 80 },
            scaleFactor: 1,
            bounds: { x: 0, y: 0, width: 100, height: 80 },
        } as any);
        vi.mocked(desktopCapturer.getSources).mockResolvedValue([
            {
                display_id: "1",
                thumbnail: { crop: () => cropped },
            },
        ] as any);
        vi.mocked(dialog.showSaveDialog).mockResolvedValue({
            canceled: false,
            filePath: "C:/tmp/out.jpg",
        });

        await captureWindowAreaAndSave({ sender: {} } as any, false);

        expect(fs.writeFile).toHaveBeenCalledWith("C:/tmp/out.jpg", jpeg);
    });

    it("captureWindowAreaAndSave restores hidden windows when source lookup fails", async () => {
        const visible = { isVisible: () => true, hide: vi.fn(), show: vi.fn() };
        const mainWindow = {
            getBounds: () => ({ x: 0, y: 0, width: 100, height: 80 }),
            isMinimized: () => true,
            restore: vi.fn(),
            focus: vi.fn(),
        };

        vi.mocked(BrowserWindow.fromWebContents).mockReturnValue(mainWindow as any);
        vi.mocked(BrowserWindow.getAllWindows).mockReturnValue([visible] as any);
        vi.mocked(screen.getDisplayMatching).mockReturnValue({
            id: 1,
            size: { width: 100, height: 80 },
            scaleFactor: 1,
            bounds: { x: 0, y: 0, width: 100, height: 80 },
        } as any);
        vi.mocked(desktopCapturer.getSources).mockResolvedValue([] as any);

        await expect(
            captureWindowAreaAndSave({ sender: {} } as any, true)
        ).rejects.toThrow("No display source found for capture.");
        expect(visible.hide).toHaveBeenCalled();
        expect(visible.show).toHaveBeenCalled();
        expect(mainWindow.restore).toHaveBeenCalled();
        expect(mainWindow.focus).toHaveBeenCalled();
    });

    it("captureWindowAreaAndSave falls back to first source when display id cannot be matched", async () => {
        const mainWindow = {
            getBounds: () => ({ x: 0, y: 0, width: 100, height: 80 }),
            isMinimized: () => false,
            restore: vi.fn(),
            focus: vi.fn(),
        };
        const thumbnail = {
            crop: () => ({
                toPNG: () => Buffer.from("png"),
                toJPEG: () => Buffer.from("jpeg"),
            }),
        };

        vi.mocked(BrowserWindow.fromWebContents).mockReturnValue(mainWindow as any);
        vi.mocked(BrowserWindow.getAllWindows).mockReturnValue([] as any);
        vi.mocked(screen.getDisplayMatching).mockReturnValue({
            id: 1,
            size: { width: 100, height: 80 },
            scaleFactor: 1,
            bounds: { x: 0, y: 0, width: 100, height: 80 },
        } as any);
        vi.mocked(desktopCapturer.getSources).mockResolvedValue([
            { display_id: "9", thumbnail },
            { display_id: "10", thumbnail },
        ] as any);
        vi.mocked(dialog.showSaveDialog).mockResolvedValue({
            canceled: false,
            filePath: "C:/tmp/out.png",
        });

        await captureWindowAreaAndSave({ sender: {} } as any, false);

        expect(mockWarn).toHaveBeenCalledWith(
            "Could not match display id, using first source.",
            1,
            ["9", "10"]
        );
    });

    it("captureWindowAreaAndSave uses the only source when no display id matches", async () => {
        const mainWindow = {
            getBounds: () => ({ x: 0, y: 0, width: 100, height: 80 }),
            isMinimized: () => false,
            restore: vi.fn(),
            focus: vi.fn(),
        };
        vi.mocked(BrowserWindow.fromWebContents).mockReturnValue(mainWindow as any);
        vi.mocked(BrowserWindow.getAllWindows).mockReturnValue([] as any);
        vi.mocked(screen.getDisplayMatching).mockReturnValue({
            id: 1,
            size: { width: 100, height: 80 },
            scaleFactor: 1,
            bounds: { x: 0, y: 0, width: 100, height: 80 },
        } as any);
        vi.mocked(desktopCapturer.getSources).mockResolvedValue([
            {
                display_id: "9",
                thumbnail: {
                    crop: () => ({
                        toPNG: () => Buffer.from("png"),
                        toJPEG: () => Buffer.from("jpeg"),
                    }),
                },
            },
        ] as any);
        vi.mocked(dialog.showSaveDialog).mockResolvedValue({
            canceled: false,
            filePath: "C:/tmp/out.png",
        });

        const result = await captureWindowAreaAndSave({ sender: {} } as any, false);

        expect(mockWarn).not.toHaveBeenCalled();
        expect(result).toEqual({
            filePath: "C:/tmp/out.png",
            width: 100,
            height: 80,
        });
    });

    it("captureWindowAreaAndSave restores windows and returns null when hide mode save is canceled", async () => {
        vi.useFakeTimers();
        const visible = { isVisible: () => true, hide: vi.fn(), show: vi.fn() };
        const mainWindow = {
            getBounds: () => ({ x: 0, y: 0, width: 100, height: 80 }),
            isMinimized: () => true,
            restore: vi.fn(),
            focus: vi.fn(),
        };
        vi.mocked(BrowserWindow.fromWebContents).mockReturnValue(mainWindow as any);
        vi.mocked(BrowserWindow.getAllWindows).mockReturnValue([visible] as any);
        vi.mocked(screen.getDisplayMatching).mockReturnValue({
            id: 1,
            size: { width: 100, height: 80 },
            scaleFactor: 1,
            bounds: { x: 0, y: 0, width: 100, height: 80 },
        } as any);
        vi.mocked(desktopCapturer.getSources).mockResolvedValue([
            {
                display_id: "1",
                thumbnail: {
                    crop: () => ({
                        toPNG: () => Buffer.from("png"),
                        toJPEG: () => Buffer.from("jpeg"),
                    }),
                },
            },
        ] as any);
        vi.mocked(dialog.showSaveDialog).mockResolvedValue({
            canceled: true,
            filePath: "",
        });

        const capturePromise = captureWindowAreaAndSave(
            { sender: {} } as any,
            true
        );
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
            { sender: {} } as any,
            "data:image/png;base64,AA=="
        );

        expect(result).toBeNull();
    });

    it("saveDataUrlImage writes jpeg in test mode for .jpg path", async () => {
        const jpegBuffer = Buffer.from("jpeg");
        vi.mocked(nativeImage.createFromDataURL).mockReturnValue({
            toJPEG: () => jpegBuffer,
            toPNG: () => Buffer.from("png"),
        } as any);

        const result = await saveDataUrlImage(
            { sender: {} } as any,
            "data:image/png;base64,AA==",
            {
                enabled: true,
                captureFilePath: "C:/tmp/capture.png",
                exportImagePath: "C:/tmp/export.jpg",
            }
        );

        expect(fs.writeFile).toHaveBeenCalledWith("C:/tmp/export.jpg", jpegBuffer);
        expect(result).toBe("C:/tmp/export.jpg");
    });

    it("saveDataUrlImage writes png in test mode for non-jpeg path", async () => {
        const pngBuffer = Buffer.from("png");
        vi.mocked(nativeImage.createFromDataURL).mockReturnValue({
            toJPEG: () => Buffer.from("jpeg"),
            toPNG: () => pngBuffer,
        } as any);

        const result = await saveDataUrlImage(
            { sender: {} } as any,
            "data:image/png;base64,AA==",
            {
                enabled: true,
                captureFilePath: "C:/tmp/capture.png",
                exportImagePath: "C:/tmp/export.png",
            }
        );

        expect(fs.writeFile).toHaveBeenCalledWith("C:/tmp/export.png", pngBuffer);
        expect(result).toBe("C:/tmp/export.png");
    });

    it("saveDataUrlImage returns null when user cancels save dialog", async () => {
        vi.mocked(BrowserWindow.fromWebContents).mockReturnValue({} as any);
        vi.mocked(dialog.showSaveDialog).mockResolvedValue({
            canceled: true,
            filePath: "",
        });

        const result = await saveDataUrlImage(
            { sender: {} } as any,
            "data:image/png;base64,AA=="
        );

        expect(result).toBeNull();
    });

    it("saveDataUrlImage saves selected jpeg path in normal mode", async () => {
        const ownerWindow = {};
        const jpegBuffer = Buffer.from("jpeg");
        vi.mocked(BrowserWindow.fromWebContents).mockReturnValue(ownerWindow as any);
        vi.mocked(dialog.showSaveDialog).mockResolvedValue({
            canceled: false,
            filePath: "C:/tmp/output.jpeg",
        });
        vi.mocked(nativeImage.createFromDataURL).mockReturnValue({
            toJPEG: () => jpegBuffer,
            toPNG: () => Buffer.from("png"),
        } as any);

        const result = await saveDataUrlImage(
            { sender: {} } as any,
            "data:image/png;base64,AA=="
        );

        expect(dialog.showSaveDialog).toHaveBeenCalledWith(
            ownerWindow,
            expect.objectContaining({ title: "Save Image" })
        );
        expect(fs.writeFile).toHaveBeenCalledWith("C:/tmp/output.jpeg", jpegBuffer);
        expect(result).toBe("C:/tmp/output.jpeg");
    });

    it("saveDataUrlImage saves selected png path in normal mode", async () => {
        const pngBuffer = Buffer.from("png");
        vi.mocked(BrowserWindow.fromWebContents).mockReturnValue({} as any);
        vi.mocked(dialog.showSaveDialog).mockResolvedValue({
            canceled: false,
            filePath: "C:/tmp/output.png",
        });
        vi.mocked(nativeImage.createFromDataURL).mockReturnValue({
            toJPEG: () => Buffer.from("jpeg"),
            toPNG: () => pngBuffer,
        } as any);

        const result = await saveDataUrlImage(
            { sender: {} } as any,
            "data:image/png;base64,AA=="
        );

        expect(fs.writeFile).toHaveBeenCalledWith("C:/tmp/output.png", pngBuffer);
        expect(result).toBe("C:/tmp/output.png");
    });
});
