import {
    desktopCapturer,
    screen,
    BrowserWindow,
    dialog,
    app,
    IpcMainInvokeEvent,
    nativeImage,
} from "electron";
import fs from "fs/promises";
import path from "path";
import log from "../logger";

const resolveTimestamp = (): number => Date.now();

export const captureWindowAreaAndSave = async (
    event: IpcMainInvokeEvent,
    hideWindow: boolean
) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return null;

    const winBounds = win.getBounds();
    const display = screen.getDisplayMatching(winBounds);

    const allWindows = BrowserWindow.getAllWindows();
    const visibleWindows = allWindows.filter((w) => w.isVisible());

    if (hideWindow) {
        visibleWindows.forEach((w) => w.hide());
        await new Promise((resolve) => setTimeout(resolve, 300));
    }

    try {
        const thumbnailSize = {
            width: display.size.width * display.scaleFactor,
            height: display.size.height * display.scaleFactor,
        };

        const sources = await desktopCapturer.getSources({
            types: ["screen"],
            thumbnailSize,
        });

        let source = sources.find(
            (s) => s.display_id === display.id.toString()
        );

        if (!source && sources.length > 0) {
            if (sources.length === 1) {
                source = sources[0];
            } else {
                log.warn(
                    "Could not match display id, using first source.",
                    display.id,
                    sources.map((s) => s.display_id)
                );
                source = sources[0];
            }
        }

        if (!source) {
            throw new Error("No display source found for capture.");
        }

        const screenshot = source.thumbnail;

        const relativeX_DIP = winBounds.x - display.bounds.x;
        const relativeY_DIP = winBounds.y - display.bounds.y;

        const scale = display.scaleFactor;
        const cropX = Math.round(relativeX_DIP * scale);
        const cropY = Math.round(relativeY_DIP * scale);
        const cropW = Math.round(winBounds.width * scale);
        const cropH = Math.round(winBounds.height * scale);

        const resultWidth = cropW / scale;
        const resultHeight = cropH / scale;

        const cropped = screenshot.crop({
            x: cropX,
            y: cropY,
            width: cropW,
            height: cropH,
        });

        if (hideWindow) {
            visibleWindows.forEach((w) => w.show());
            if (win.isMinimized()) win.restore();
            win.focus();
        }

        const now = resolveTimestamp();
        const { filePath } = await dialog.showSaveDialog(win, {
            title: "Save Capture",
            defaultPath: path.join(
                app.getPath("pictures"),
                `capture_${now}.png`
            ),
            filters: [
                { name: "PNG Images", extensions: ["png"] },
                { name: "JPEG Images", extensions: ["jpg", "jpeg"] },
            ],
        });

        if (filePath) {
            let buffer = cropped.toPNG();
            const ext = path.extname(filePath).toLowerCase();
            if (ext === ".jpg" || ext === ".jpeg") {
                buffer = cropped.toJPEG(90);
            }

            await fs.writeFile(filePath, buffer);
            return {
                filePath,
                width: resultWidth,
                height: resultHeight,
            };
        }

        return null;
    } catch (error) {
        log.error("Screen capture failed:", error);
        if (hideWindow) {
            visibleWindows.forEach((w) => w.show());
            if (win.isMinimized()) win.restore();
            win.focus();
        }
        throw error;
    }
};

export const saveDataUrlImage = async (
    event: IpcMainInvokeEvent,
    dataUrl: string
): Promise<string | null> => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return null;

    const now = resolveTimestamp();
    const { filePath } = await dialog.showSaveDialog(win, {
        title: "Save Image",
        defaultPath: path.join(app.getPath("pictures"), `image_${now}.png`),
        filters: [
            { name: "PNG Images", extensions: ["png"] },
            { name: "JPEG Images", extensions: ["jpg", "jpeg"] },
        ],
    });

    if (!filePath) {
        return null;
    }

    const image = nativeImage.createFromDataURL(dataUrl);
    const ext = path.extname(filePath).toLowerCase();
    const buffer =
        ext === ".jpg" || ext === ".jpeg" ? image.toJPEG(90) : image.toPNG();
    await fs.writeFile(filePath, buffer);
    return filePath;
};
