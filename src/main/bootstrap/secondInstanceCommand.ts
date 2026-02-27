import fs from "fs";
import path from "path";
import type { BrowserWindow, NativeImage } from "electron";

import { isSupportedImagePath } from "../../shared/constants/imageFormats";
import type { AppControlCommand } from "../../shared/types/AppControlCommand";
import log from "../logger";
import type { WindowManager } from "../windows/windowManager";

const SCENE_FILE_SUFFIX = ".scene.json";
const EXPORT_FILE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg"]);
const SECOND_INSTANCE_COMMAND_OPTIONS = new Set([
    "--add-image",
    "--set-opacity",
    "--switch-scene",
    "--export",
]);

const normalizeArgv = (commandLine: string[], isPackaged: boolean): string[] =>
    isPackaged ? commandLine.slice(1) : commandLine.slice(2);

const isOptionToken = (value: string): boolean => value.startsWith("--");

const parseOpacityRatio = (value: string, optionName: string): number => {
    const opacityPercent = Number(value);
    if (
        !Number.isFinite(opacityPercent) ||
        opacityPercent < 0 ||
        opacityPercent > 100
    ) {
        throw new Error(`${optionName} must be between 0 and 100.`);
    }
    return opacityPercent / 100;
};

const requireOptionValue = (
    argv: string[],
    optionIndex: number,
    optionName: string
): string => {
    const value = argv[optionIndex + 1];
    if (!value || isOptionToken(value)) {
        throw new Error(`${optionName} requires a value.`);
    }
    return value;
};

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

const ensureSingleCommand = (
    current: "add-image" | "set-opacity" | "switch-scene" | "export" | null,
    next: "add-image" | "set-opacity" | "switch-scene" | "export"
): void => {
    if (current && current !== next) {
        throw new Error(
            "Only one second-instance command can be specified at a time."
        );
    }
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
    const argv = normalizeArgv(commandLine, isPackaged);
    const hasCommandOption = argv.some((token) =>
        SECOND_INSTANCE_COMMAND_OPTIONS.has(token)
    );

    if (!hasCommandOption) {
        return null;
    }

    let commandKind:
        | "add-image"
        | "set-opacity"
        | "switch-scene"
        | "export"
        | null = null;
    let addImagePath: string | null = null;
    let switchScenePath: string | null = null;
    let exportPath: string | null = null;
    let setOpacity: number | null = null;
    let addImageOpacity: number | undefined;

    for (let index = 0; index < argv.length; index += 1) {
        const token = argv[index];

        if (token === "--add-image") {
            ensureSingleCommand(commandKind, "add-image");
            addImagePath = resolveImagePath(
                requireOptionValue(argv, index, "--add-image")
            );
            commandKind = "add-image";
            index += 1;
            continue;
        }

        if (token === "--set-opacity") {
            ensureSingleCommand(commandKind, "set-opacity");
            setOpacity = parseOpacityRatio(
                requireOptionValue(argv, index, "--set-opacity"),
                "--set-opacity"
            );
            commandKind = "set-opacity";
            index += 1;
            continue;
        }

        if (token === "--switch-scene") {
            ensureSingleCommand(commandKind, "switch-scene");
            switchScenePath = resolveScenePath(
                requireOptionValue(argv, index, "--switch-scene")
            );
            commandKind = "switch-scene";
            index += 1;
            continue;
        }

        if (token === "--export") {
            ensureSingleCommand(commandKind, "export");
            exportPath = resolveExportPath(
                requireOptionValue(argv, index, "--export")
            );
            commandKind = "export";
            index += 1;
            continue;
        }

        if (token === "--opacity") {
            addImageOpacity = parseOpacityRatio(
                requireOptionValue(argv, index, "--opacity"),
                "--opacity"
            );
            index += 1;
            continue;
        }

        if (token === "--e2e") {
            continue;
        }

        if (isOptionToken(token)) {
            throw new Error(`Unknown second-instance option: ${token}`);
        }

        throw new Error(
            "Positional arguments are not supported with second-instance commands."
        );
    }

    if (!commandKind) {
        return null;
    }

    if (addImageOpacity !== undefined && commandKind !== "add-image") {
        throw new Error("--opacity can only be used with --add-image.");
    }

    if (commandKind === "add-image") {
        if (!addImagePath) {
            throw new Error("--add-image requires a path.");
        }
        return {
            kind: "app-control",
            command: {
                kind: "add-image",
                imagePath: addImagePath,
                opacity: addImageOpacity,
            },
        };
    }

    if (commandKind === "set-opacity") {
        if (setOpacity === null) {
            throw new Error("--set-opacity requires a numeric value.");
        }
        return {
            kind: "app-control",
            command: {
                kind: "set-opacity",
                opacity: setOpacity,
            },
        };
    }

    if (commandKind === "switch-scene") {
        if (!switchScenePath) {
            throw new Error("--switch-scene requires a path.");
        }
        return {
            kind: "switch-scene",
            scenePath: switchScenePath,
        };
    }

    if (!exportPath) {
        throw new Error("--export requires an output path.");
    }

    return {
        kind: "export",
        outputPath: exportPath,
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
