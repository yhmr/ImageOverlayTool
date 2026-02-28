import {
    isOptionToken,
    normalizeArgv,
    parseOpacityPercent,
    requireOptionValue,
} from "./cliArgs";
import {
    CONTROL_COMMAND_OPTION_TOKENS,
    GLOBAL_OPTION_TOKENS,
} from "./cliOptionTokens";
import { resolveCliSubcommandArgv } from "./cliSubcommand";

type ParsedControlCommandKind =
    | "add-image"
    | "set-opacity"
    | "switch-scene"
    | "capture-window"
    | "save-stage"
    | "wait-stable";

const DEFAULT_WAIT_STABLE_TIMEOUT_MS = 5000;
const MAX_WAIT_STABLE_TIMEOUT_MS = 120000;

export type ParsedControlCommand =
    | {
          kind: "add-image";
          imagePath: string;
          opacity?: number;
      }
    | {
          kind: "set-opacity";
          opacity: number;
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

const parseOpacityRatio = (value: string, optionName: string): number => {
    return parseOpacityPercent(value, optionName) / 100;
};

const parseTimeoutMs = (value: string): number => {
    const timeoutMs = Number(value);
    if (
        !Number.isFinite(timeoutMs) ||
        !Number.isInteger(timeoutMs) ||
        timeoutMs <= 0
    ) {
        throw new Error("--timeout-ms must be a positive integer.");
    }
    if (timeoutMs > MAX_WAIT_STABLE_TIMEOUT_MS) {
        throw new Error(
            `--timeout-ms must be less than or equal to ${MAX_WAIT_STABLE_TIMEOUT_MS}.`
        );
    }
    return timeoutMs;
};

const ensureSingleCommand = (
    current: ParsedControlCommandKind | null,
    next: ParsedControlCommandKind
): void => {
    if (current && current !== next) {
        throw new Error(
            "Only one second-instance command can be specified at a time."
        );
    }
};

export const parseControlCommand = (
    commandLine: string[],
    isPackaged: boolean
): ParsedControlCommand | null => {
    const normalizedArgv = normalizeArgv(commandLine, isPackaged);
    const { subcommand, argv } = resolveCliSubcommandArgv(normalizedArgv);
    const hasCommandOption = argv.some((token) =>
        CONTROL_COMMAND_OPTION_TOKENS.has(token)
    );

    if (subcommand === null && hasCommandOption) {
        throw new Error('Control commands require the "control" subcommand.');
    }

    if (subcommand === "startup") {
        return null;
    }

    if (subcommand === "control" && !hasCommandOption) {
        throw new Error("control subcommand requires a command option.");
    }

    if (!hasCommandOption) {
        return null;
    }

    let commandKind: ParsedControlCommandKind | null = null;
    let addImagePath: string | null = null;
    let switchScenePath: string | null = null;
    let captureWindowPath: string | null = null;
    let saveStagePath: string | null = null;
    let setOpacity: number | null = null;
    let addImageOpacity: number | undefined;
    let waitStableTimeoutMs: number | null = null;

    for (let index = 0; index < argv.length; index += 1) {
        const token = argv[index];

        if (token === "--add-image") {
            ensureSingleCommand(commandKind, "add-image");
            addImagePath = requireOptionValue(argv, index, "--add-image");
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
            switchScenePath = requireOptionValue(argv, index, "--switch-scene");
            commandKind = "switch-scene";
            index += 1;
            continue;
        }

        if (token === "--capture-window") {
            ensureSingleCommand(commandKind, "capture-window");
            captureWindowPath = requireOptionValue(
                argv,
                index,
                "--capture-window"
            );
            commandKind = "capture-window";
            index += 1;
            continue;
        }

        if (token === "--save-stage") {
            ensureSingleCommand(commandKind, "save-stage");
            saveStagePath = requireOptionValue(argv, index, "--save-stage");
            commandKind = "save-stage";
            index += 1;
            continue;
        }

        if (token === "--wait-stable") {
            ensureSingleCommand(commandKind, "wait-stable");
            commandKind = "wait-stable";
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

        if (token === "--timeout-ms") {
            waitStableTimeoutMs = parseTimeoutMs(
                requireOptionValue(argv, index, "--timeout-ms")
            );
            index += 1;
            continue;
        }

        if (GLOBAL_OPTION_TOKENS.has(token)) {
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

    if (waitStableTimeoutMs !== null && commandKind !== "wait-stable") {
        throw new Error("--timeout-ms can only be used with --wait-stable.");
    }

    if (commandKind === "add-image") {
        if (!addImagePath) {
            throw new Error("--add-image requires a path.");
        }
        return {
            kind: "add-image",
            imagePath: addImagePath,
            opacity: addImageOpacity,
        };
    }

    if (commandKind === "set-opacity") {
        if (setOpacity === null) {
            throw new Error("--set-opacity requires a numeric value.");
        }
        return {
            kind: "set-opacity",
            opacity: setOpacity,
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

    if (commandKind === "wait-stable") {
        return {
            kind: "wait-stable",
            timeoutMs: waitStableTimeoutMs ?? DEFAULT_WAIT_STABLE_TIMEOUT_MS,
        };
    }

    if (commandKind === "capture-window") {
        if (!captureWindowPath) {
            throw new Error("--capture-window requires an output path.");
        }
        return {
            kind: "capture-window",
            outputPath: captureWindowPath,
        };
    }

    if (!saveStagePath) {
        throw new Error("--save-stage requires an output path.");
    }

    return {
        kind: "save-stage",
        outputPath: saveStagePath,
    };
};
