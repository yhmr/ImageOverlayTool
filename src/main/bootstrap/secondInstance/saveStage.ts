import fs from "fs";
import path from "path";
import type { BrowserWindow } from "electron";

import { SAVE_STAGE_DATA_URL_BRIDGE_KEY } from "../../../shared/constants/saveStageBridge";
import log from "../../logger";
import type { WindowManager } from "../../windows/windowManager";
import type { SaveStageSecondInstanceCommand } from "./types";
import { assertMainWindowAvailable } from "./windowAvailability";

const SAVE_STAGE_TIMEOUT_MS = 5000;
const SAVE_STAGE_POLL_INTERVAL_MS = 50;
const IMAGE_DATA_URL_REGEX =
    /^data:(image\/png|image\/jpeg);base64,([A-Za-z0-9+/=]+)$/;

const sleep = async (ms: number): Promise<void> => {
    await new Promise<void>((resolve) => {
        setTimeout(resolve, ms);
    });
};

const readStageDataUrlFromRenderer = async (
    mainWindow: BrowserWindow,
    mimeType: "image/png" | "image/jpeg"
): Promise<string | null> => {
    const bridgeKeyLiteral = JSON.stringify(SAVE_STAGE_DATA_URL_BRIDGE_KEY);
    const mimeTypeLiteral = JSON.stringify(mimeType);
    const dataUrl = await mainWindow.webContents.executeJavaScript(
        `(() => {
            const bridge = window[${bridgeKeyLiteral}];
            if (typeof bridge !== "function") {
                return null;
            }
            return bridge(${mimeTypeLiteral});
        })();`,
        true
    );
    if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/")) {
        return null;
    }
    return dataUrl;
};

const resolveStageDataUrl = async (
    mainWindow: BrowserWindow,
    mimeType: "image/png" | "image/jpeg"
): Promise<string> => {
    const deadline = Date.now() + SAVE_STAGE_TIMEOUT_MS;
    let lastError: unknown = null;

    while (Date.now() < deadline) {
        if (mainWindow.isDestroyed()) {
            throw new Error("Main window is not available for --save-stage.");
        }

        try {
            const dataUrl = await readStageDataUrlFromRenderer(
                mainWindow,
                mimeType
            );
            if (dataUrl) {
                return dataUrl;
            }
        } catch (error) {
            lastError = error;
        }

        const pollDelayMs = Math.min(
            SAVE_STAGE_POLL_INTERVAL_MS,
            Math.max(1, deadline - Date.now())
        );
        await sleep(pollDelayMs);
    }

    if (lastError instanceof Error) {
        throw new Error(`--save-stage failed: ${lastError.message}`);
    }

    throw new Error(
        `--save-stage timed out after ${SAVE_STAGE_TIMEOUT_MS}ms while waiting for renderer readiness.`
    );
};

const decodeImageDataUrl = (
    dataUrl: string
): { mimeType: "image/png" | "image/jpeg"; buffer: Buffer } => {
    const match = IMAGE_DATA_URL_REGEX.exec(dataUrl);
    if (!match) {
        throw new Error("--save-stage returned an unsupported data URL.");
    }

    const [, rawMimeType, base64Payload] = match;
    if (!base64Payload) {
        throw new Error("--save-stage returned empty image data.");
    }

    const mimeType = rawMimeType as "image/png" | "image/jpeg";
    return {
        mimeType,
        buffer: Buffer.from(base64Payload, "base64"),
    };
};

const saveMainWindowStageToPath = async (
    command: SaveStageSecondInstanceCommand,
    windowManager: WindowManager
): Promise<void> => {
    const mainWindow = assertMainWindowAvailable(
        windowManager.getMainWindow(),
        "--save-stage"
    );
    if (mainWindow.isMinimized()) {
        mainWindow.restore();
    }
    if (!mainWindow.isVisible()) {
        mainWindow.show();
    }

    const ext = path.extname(command.outputPath).toLowerCase();
    const requestedMimeType: "image/png" | "image/jpeg" =
        ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : "image/png";

    const dataUrl = await resolveStageDataUrl(mainWindow, requestedMimeType);
    const decoded = decodeImageDataUrl(dataUrl);
    if (decoded.mimeType !== requestedMimeType) {
        throw new Error(
            `--save-stage returned ${decoded.mimeType}, expected ${requestedMimeType}.`
        );
    }

    await fs.promises.mkdir(path.dirname(command.outputPath), {
        recursive: true,
    });
    await fs.promises.writeFile(command.outputPath, decoded.buffer);
};

export const executeSaveStageCommand = async (
    command: SaveStageSecondInstanceCommand,
    windowManager: WindowManager
): Promise<void> => {
    await saveMainWindowStageToPath(command, windowManager);
    log.info(`[second-instance] Saved stage image: ${command.outputPath}`);
};
