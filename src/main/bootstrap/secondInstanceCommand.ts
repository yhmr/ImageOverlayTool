import fs from "fs";
import path from "path";
import type { BrowserWindow, NativeImage } from "electron";

import { isSupportedImagePath } from "../../shared/constants/imageFormats";
import type { AppControlCommand } from "../../shared/types/AppControlCommand";
import log from "../logger";
import type { WindowManager } from "../windows/windowManager";
import { parseControlCommand } from "./controlParser";

const SCENE_FILE_SUFFIX = ".scene.json";
const EXPORT_FILE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg"]);

const resolveExistingFilePath = (
    inputPath: string,
    optionName: string
): string => {
    const resolvedPath = path.resolve(inputPath);
    if (!fs.existsSync(resolvedPath) || !fs.statSync(resolvedPath).isFile()) {
        throw new Error(`${optionName} file not found: ${inputPath}`);
    }
    return resolvedPath;
};

const resolveImagePath = (inputPath: string): string => {
    const resolvedPath = resolveExistingFilePath(inputPath, "--add-image");
    if (!isSupportedImagePath(resolvedPath)) {
        throw new Error(`Unsupported image format: ${inputPath}`);
    }
    return resolvedPath;
};

const resolveScenePath = (inputPath: string): string => {
    const resolvedPath = resolveExistingFilePath(inputPath, "--switch-scene");
    if (!resolvedPath.toLowerCase().endsWith(SCENE_FILE_SUFFIX)) {
        throw new Error("--switch-scene requires a .scene.json path.");
    }
    return resolvedPath;
};

const resolveExportPath = (inputPath: string): string => {
    const resolvedPath = path.resolve(inputPath);
    const ext = path.extname(resolvedPath).toLowerCase();
    if (!EXPORT_FILE_EXTENSIONS.has(ext)) {
        throw new Error("--export supports only .png / .jpg / .jpeg.");
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
          kind: "export";
          outputPath: string;
      };

export const resolveSecondInstanceCommand = (
    commandLine: string[],
    isPackaged: boolean
): SecondInstanceCommand | null => {
    const parsed = parseControlCommand(commandLine, isPackaged);
    if (!parsed) {
        return null;
    }

    if (parsed.kind === "add-image") {
        return {
            kind: "app-control",
            command: {
                kind: "add-image",
                imagePath: resolveImagePath(parsed.imagePath),
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
            scenePath: resolveScenePath(parsed.scenePath),
        };
    }

    return {
        kind: "export",
        outputPath: resolveExportPath(parsed.outputPath),
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

    const mainWindow = windowManager.getMainWindow();
    if (!mainWindow || mainWindow.isDestroyed()) {
        throw new Error("Main window is not available for --export.");
    }

    await captureMainWindowToPath(mainWindow, command.outputPath);
    log.info(`[second-instance] Exported screenshot: ${command.outputPath}`);
};
