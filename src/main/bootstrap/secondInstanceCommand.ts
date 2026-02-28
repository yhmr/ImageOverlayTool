import type { WindowManager } from "../windows/windowManager";
import {
    type ParsedControlCommand,
    parseControlCommand,
} from "./controlParser";
import { executeCaptureWindowCommand } from "./secondInstance/captureWindow";
import {
    resolveImagePath,
    resolveOutputImagePath,
    resolveScenePath,
} from "./secondInstance/pathResolution";
import { executeSaveStageCommand } from "./secondInstance/saveStage";
import type { SecondInstanceCommand } from "./secondInstance/types";
import { executeWaitStableCommand } from "./secondInstance/waitStable";

export type { SecondInstanceCommand } from "./secondInstance/types";

const resolveCommandWithWorkingDirectory = (
    parsed: ParsedControlCommand,
    workingDirectory: string
): SecondInstanceCommand => {
    switch (parsed.kind) {
        case "add-image":
            return {
                kind: "app-control",
                command: {
                    kind: "add-image",
                    imagePath: resolveImagePath(
                        parsed.imagePath,
                        workingDirectory
                    ),
                    opacity: parsed.opacity,
                },
            };
        case "set-opacity":
            return {
                kind: "app-control",
                command: {
                    kind: "set-opacity",
                    opacity: parsed.opacity,
                },
            };
        case "switch-scene":
            return {
                kind: "switch-scene",
                scenePath: resolveScenePath(parsed.scenePath, workingDirectory),
            };
        case "capture-window":
            return {
                kind: "capture-window",
                outputPath: resolveOutputImagePath(
                    parsed.outputPath,
                    workingDirectory,
                    "--capture-window"
                ),
            };
        case "save-stage":
            return {
                kind: "save-stage",
                outputPath: resolveOutputImagePath(
                    parsed.outputPath,
                    workingDirectory,
                    "--save-stage"
                ),
            };
        case "wait-stable":
            return {
                kind: "wait-stable",
                timeoutMs: parsed.timeoutMs,
            };
    }
};

export const resolveSecondInstanceCommand = (
    commandLine: string[],
    isPackaged: boolean,
    workingDirectory: string = process.cwd()
): SecondInstanceCommand | null => {
    const parsed = parseControlCommand(commandLine, isPackaged);
    if (!parsed) {
        return null;
    }

    const baseWorkingDirectory =
        workingDirectory.trim().length > 0 ? workingDirectory : process.cwd();
    return resolveCommandWithWorkingDirectory(parsed, baseWorkingDirectory);
};

export const executeSecondInstanceCommand = async (
    command: SecondInstanceCommand,
    windowManager: WindowManager
): Promise<void> => {
    switch (command.kind) {
        case "app-control":
            windowManager.applyAppControlCommand(command.command);
            return;
        case "switch-scene":
            windowManager.openFile(command.scenePath);
            return;
        case "wait-stable":
            await executeWaitStableCommand(command, windowManager);
            return;
        case "save-stage":
            await executeSaveStageCommand(command, windowManager);
            return;
        case "capture-window":
            await executeCaptureWindowCommand(command, windowManager);
            return;
    }
};
