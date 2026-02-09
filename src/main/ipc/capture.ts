import {
    ipcMain,
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

export interface CaptureHandlerOptions {
    testMode?: {
        enabled: boolean;
        captureFilePath: string;
        exportImagePath: string;
        fixedNow?: number;
        captureWidth?: number;
        captureHeight?: number;
    };
}

const E2E_PLACEHOLDER_IMAGE =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4////fwAJ+wP9KobjigAAAABJRU5ErkJggg==";

const ensureParentDir = async (filePath: string): Promise<void> => {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
};

const ensurePlaceholderCapture = async (filePath: string): Promise<void> => {
    await ensureParentDir(filePath);
    const image = nativeImage.createFromDataURL(E2E_PLACEHOLDER_IMAGE);
    await fs.writeFile(filePath, image.toPNG());
};

const resolveTimestamp = (fixedNow?: number): number => {
    return typeof fixedNow === "number" ? fixedNow : Date.now();
};

// キャプチャの共通ロジック
// hideWindow: trueなら撮影前にウィンドウを隠し、撮影後に戻す（背景キャプチャ用）
// hideWindow: falseならそのまま撮影する（エクスポート用）
const captureLogic = async (
    event: IpcMainInvokeEvent,
    hideWindow: boolean,
    testMode?: CaptureHandlerOptions["testMode"]
) => {
    if (testMode?.enabled) {
        await ensurePlaceholderCapture(testMode.captureFilePath);
        return {
            filePath: testMode.captureFilePath,
            width: testMode.captureWidth ?? 1280,
            height: testMode.captureHeight ?? 720,
        };
    }

    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return null;

    // 1. ウィンドウ位置・サイズの取得 (ピクセル単位)
    const winBounds = win.getBounds();
    const display = screen.getDisplayMatching(winBounds);

    // 2. ウィンドウを一時的に隠す
    const allWindows = BrowserWindow.getAllWindows();
    const visibleWindows = allWindows.filter((w) => w.isVisible());

    if (hideWindow) {
        visibleWindows.forEach((w) => w.hide());
        // アニメーション完了待ち
        await new Promise((resolve) => setTimeout(resolve, 300));
    }

    try {
        // 3. スクリーンキャプチャ
        const thumbnailSize = {
            width: display.size.width * display.scaleFactor,
            height: display.size.height * display.scaleFactor,
        };

        const sources = await desktopCapturer.getSources({
            types: ["screen"],
            thumbnailSize: thumbnailSize,
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

        // 4. クロップ処理
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

        // 5. ウィンドウ復帰
        if (hideWindow) {
            visibleWindows.forEach((w) => w.show());
            if (win.isMinimized()) win.restore();
            win.focus();
        }

        // 6. 保存ダイアログ
        const now = resolveTimestamp(testMode?.fixedNow);
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
        // 失敗時もウィンドウは戻す
        if (hideWindow) {
            visibleWindows.forEach((w) => w.show());
            if (win.isMinimized()) win.restore();
            win.focus();
        }
        throw error;
    }
};

export const registerCaptureHandlers = (
    options?: CaptureHandlerOptions
): void => {
    const testMode = options?.testMode;

    // 既存のキャプチャ（ウィンドウを隠す）
    ipcMain.handle("capture-screen", async (event: IpcMainInvokeEvent) => {
        return captureLogic(event, true, testMode);
    });

    // 新規：ウィンドウ込みキャプチャ（ウィンドウを隠さない）
    ipcMain.handle("capture-window", async (event: IpcMainInvokeEvent) => {
        return captureLogic(event, false, testMode);
    });

    // 新規：データURLを保存
    ipcMain.handle(
        "save-image-data",
        async (event: IpcMainInvokeEvent, dataUrl: string) => {
            if (testMode?.enabled) {
                await ensureParentDir(testMode.exportImagePath);
                const image = nativeImage.createFromDataURL(dataUrl);
                const ext = path
                    .extname(testMode.exportImagePath)
                    .toLowerCase();
                const buffer =
                    ext === ".jpg" || ext === ".jpeg"
                        ? image.toJPEG(90)
                        : image.toPNG();
                await fs.writeFile(testMode.exportImagePath, buffer);
                return testMode.exportImagePath;
            }

            const win = BrowserWindow.fromWebContents(event.sender);
            if (!win) return null;

            const now = resolveTimestamp(testMode?.fixedNow);
            const { filePath } = await dialog.showSaveDialog(win, {
                title: "Save Image",
                defaultPath: path.join(
                    app.getPath("pictures"),
                    `image_${now}.png`
                ),
                filters: [
                    { name: "PNG Images", extensions: ["png"] },
                    { name: "JPEG Images", extensions: ["jpg", "jpeg"] },
                ],
            });

            if (filePath) {
                const image = nativeImage.createFromDataURL(dataUrl);
                const ext = path.extname(filePath).toLowerCase();
                let buffer;
                if (ext === ".jpg" || ext === ".jpeg") {
                    buffer = image.toJPEG(90);
                } else {
                    buffer = image.toPNG();
                }
                await fs.writeFile(filePath, buffer);
                return filePath;
            }
            return null;
        }
    );
};
