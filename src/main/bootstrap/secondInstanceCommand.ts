import fs from "fs";
import path from "path";
import type { BrowserWindow, NativeImage } from "electron";

import { isSupportedImagePath } from "../../shared/constants/imageFormats";
import { SAVE_STAGE_DATA_URL_BRIDGE_KEY } from "../../shared/constants/saveStageBridge";
import type { AppControlCommand } from "../../shared/types/AppControlCommand";
import log from "../logger";
import type { WindowManager } from "../windows/windowManager";
import { parseControlCommand } from "./controlParser";

const SCENE_FILE_SUFFIX = ".scene.json";
const OUTPUT_IMAGE_FILE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg"]);
const WAIT_STABLE_POLL_INTERVAL_MS = 50;
const WAIT_STABLE_SETTLE_MS = 150;
const SAVE_STAGE_TIMEOUT_MS = 5000;
const SAVE_STAGE_POLL_INTERVAL_MS = 50;
const IMAGE_DATA_URL_REGEX =
    /^data:(image\/png|image\/jpeg);base64,([A-Za-z0-9+/=]+)$/;

const resolvePathFromWorkingDirectory = (
    inputPath: string,
    workingDirectory: string
): string => path.resolve(workingDirectory, inputPath);

const resolveExistingFilePath = (
    inputPath: string,
    optionName: string,
    workingDirectory: string
): string => {
    const resolvedPath = resolvePathFromWorkingDirectory(
        inputPath,
        workingDirectory
    );
    if (!fs.existsSync(resolvedPath) || !fs.statSync(resolvedPath).isFile()) {
        throw new Error(`${optionName} file not found: ${inputPath}`);
    }
    return resolvedPath;
};

const resolveImagePath = (
    inputPath: string,
    workingDirectory: string
): string => {
    const resolvedPath = resolveExistingFilePath(
        inputPath,
        "--add-image",
        workingDirectory
    );
    if (!isSupportedImagePath(resolvedPath)) {
        throw new Error(`Unsupported image format: ${inputPath}`);
    }
    return resolvedPath;
};

const resolveScenePath = (
    inputPath: string,
    workingDirectory: string
): string => {
    const resolvedPath = resolveExistingFilePath(
        inputPath,
        "--switch-scene",
        workingDirectory
    );
    if (!resolvedPath.toLowerCase().endsWith(SCENE_FILE_SUFFIX)) {
        throw new Error("--switch-scene requires a .scene.json path.");
    }
    return resolvedPath;
};

const resolveOutputImagePath = (
    inputPath: string,
    workingDirectory: string,
    optionName: "--capture-window" | "--save-stage"
): string => {
    const resolvedPath = resolvePathFromWorkingDirectory(
        inputPath,
        workingDirectory
    );
    const ext = path.extname(resolvedPath).toLowerCase();
    if (!OUTPUT_IMAGE_FILE_EXTENSIONS.has(ext)) {
        throw new Error(`${optionName} supports only .png / .jpg / .jpeg.`);
    }
    return resolvedPath;
};

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
    mainWindow: BrowserWindow,
    outputPath: string
): Promise<void> => {
    if (mainWindow.isMinimized()) {
        mainWindow.restore();
    }
    const image = await mainWindow.capturePage();
    await saveCapturedImage(image, outputPath);
};

const sleep = async (ms: number): Promise<void> => {
    await new Promise<void>((resolve) => {
        setTimeout(resolve, ms);
    });
};

const assertMainWindowAvailable = (
    mainWindow: BrowserWindow | null,
    optionName: "--capture-window" | "--save-stage" | "--wait-stable"
): BrowserWindow => {
    if (!mainWindow || mainWindow.isDestroyed()) {
        throw new Error(`Main window is not available for ${optionName}.`);
    }
    return mainWindow;
};

const isMainWindowStable = (mainWindow: BrowserWindow): boolean => {
    if (mainWindow.isDestroyed()) {
        return false;
    }

    const webContents = mainWindow.webContents;
    return (
        mainWindow.isVisible() &&
        !webContents.isLoading() &&
        !webContents.isLoadingMainFrame()
    );
};

const waitForMainWindowStable = async (
    mainWindow: BrowserWindow,
    timeoutMs: number
): Promise<void> => {
    const deadline = Date.now() + timeoutMs;

    if (mainWindow.isMinimized()) {
        mainWindow.restore();
    }
    if (!mainWindow.isVisible()) {
        mainWindow.show();
    }

    while (Date.now() < deadline) {
        if (mainWindow.isDestroyed()) {
            throw new Error("Main window is not available for --wait-stable.");
        }

        if (isMainWindowStable(mainWindow)) {
            const settleDelayMs = Math.min(
                WAIT_STABLE_SETTLE_MS,
                Math.max(0, deadline - Date.now())
            );
            if (settleDelayMs > 0) {
                await sleep(settleDelayMs);
            }
            if (isMainWindowStable(mainWindow)) {
                return;
            }
        }

        const pollDelayMs = Math.min(
            WAIT_STABLE_POLL_INTERVAL_MS,
            Math.max(1, deadline - Date.now())
        );
        await sleep(pollDelayMs);
    }

    throw new Error(`--wait-stable timed out after ${timeoutMs}ms.`);
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
    mainWindow: BrowserWindow,
    outputPath: string
): Promise<void> => {
    if (mainWindow.isMinimized()) {
        mainWindow.restore();
    }
    if (!mainWindow.isVisible()) {
        mainWindow.show();
    }
    const ext = path.extname(outputPath).toLowerCase();
    const requestedMimeType: "image/png" | "image/jpeg" =
        ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : "image/png";

    const dataUrl = await resolveStageDataUrl(mainWindow, requestedMimeType);
    const decoded = decodeImageDataUrl(dataUrl);
    if (decoded.mimeType !== requestedMimeType) {
        throw new Error(
            `--save-stage returned ${decoded.mimeType}, expected ${requestedMimeType}.`
        );
    }
    await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.promises.writeFile(outputPath, decoded.buffer);
};

export type SecondInstanceCommand =
    | {
          kind: "app-control";
          command: AppControlCommand;
      }
    | {
          kind: "switch-scene";
          scenePath: string;
      }
    | {
          kind: "capture-window";
          outputPath: string;
      }
    | {
          kind: "save-stage";
          outputPath: string;
      }
    | {
          kind: "wait-stable";
          timeoutMs: number;
      };

export const resolveSecondInstanceCommand = (
    commandLine: string[],
    isPackaged: boolean,
    workingDirectory: string = process.cwd()
): SecondInstanceCommand | null => {
    const parsed = parseControlCommand(commandLine, isPackaged);
    const baseWorkingDirectory =
        workingDirectory.trim().length > 0 ? workingDirectory : process.cwd();
    if (!parsed) {
        return null;
    }

    if (parsed.kind === "add-image") {
        return {
            kind: "app-control",
            command: {
                kind: "add-image",
                imagePath: resolveImagePath(
                    parsed.imagePath,
                    baseWorkingDirectory
                ),
                opacity: parsed.opacity,
            },
        };
    }

    if (parsed.kind === "set-opacity") {
        return {
            kind: "app-control",
            command: {
                kind: "set-opacity",
                opacity: parsed.opacity,
            },
        };
    }

    if (parsed.kind === "switch-scene") {
        return {
            kind: "switch-scene",
            scenePath: resolveScenePath(parsed.scenePath, baseWorkingDirectory),
        };
    }

    if (parsed.kind === "wait-stable") {
        return {
            kind: "wait-stable",
            timeoutMs: parsed.timeoutMs,
        };
    }

    if (parsed.kind === "save-stage") {
        return {
            kind: "save-stage",
            outputPath: resolveOutputImagePath(
                parsed.outputPath,
                baseWorkingDirectory,
                "--save-stage"
            ),
        };
    }

    return {
        kind: "capture-window",
        outputPath: resolveOutputImagePath(
            parsed.outputPath,
            baseWorkingDirectory,
            "--capture-window"
        ),
    };
};

export const executeSecondInstanceCommand = async (
    command: SecondInstanceCommand,
    windowManager: WindowManager
): Promise<void> => {
    if (command.kind === "app-control") {
        windowManager.applyAppControlCommand(command.command);
        return;
    }

    if (command.kind === "switch-scene") {
        windowManager.openFile(command.scenePath);
        return;
    }

    if (command.kind === "wait-stable") {
        const mainWindow = assertMainWindowAvailable(
            windowManager.getMainWindow(),
            "--wait-stable"
        );
        await waitForMainWindowStable(mainWindow, command.timeoutMs);
        log.info(
            `[second-instance] Main window became stable within ${command.timeoutMs}ms`
        );
        return;
    }

    if (command.kind === "save-stage") {
        const mainWindow = assertMainWindowAvailable(
            windowManager.getMainWindow(),
            "--save-stage"
        );
        await saveMainWindowStageToPath(mainWindow, command.outputPath);
        log.info(`[second-instance] Saved stage image: ${command.outputPath}`);
        return;
    }

    const mainWindow = assertMainWindowAvailable(
        windowManager.getMainWindow(),
        "--capture-window"
    );
    await captureMainWindowToPath(mainWindow, command.outputPath);
    log.info(`[second-instance] Captured window image: ${command.outputPath}`);
};
