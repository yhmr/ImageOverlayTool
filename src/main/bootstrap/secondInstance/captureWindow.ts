import fs from "fs";
import path from "path";
import type { NativeImage } from "electron";

import log from "../../logger";
import type { WindowManager } from "../../windows/windowManager";
import type { CaptureWindowSecondInstanceCommand } from "./types";
import { assertMainWindowAvailable } from "./windowAvailability";

const saveCapturedImage = async (
    image: NativeImage,
    outputPath: string
): Promise<void> => {
    await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });
    const ext = path.extname(outputPath).toLowerCase();
    const buffer =
        ext === ".jpg" || ext === ".jpeg" ? image.toJPEG(90) : image.toPNG();
    await fs.promises.writeFile(outputPath, buffer);
};

const captureMainWindowToPath = async (
    command: CaptureWindowSecondInstanceCommand,
    windowManager: WindowManager
): Promise<void> => {
    const mainWindow = assertMainWindowAvailable(
        windowManager.getMainWindow(),
        "--capture-window"
    );
    if (mainWindow.isMinimized()) {
        mainWindow.restore();
    }
    const image = await mainWindow.capturePage();
    await saveCapturedImage(image, command.outputPath);
};

export const executeCaptureWindowCommand = async (
    command: CaptureWindowSecondInstanceCommand,
    windowManager: WindowManager
): Promise<void> => {
    await captureMainWindowToPath(command, windowManager);
    log.info(`[second-instance] Captured window image: ${command.outputPath}`);
};
