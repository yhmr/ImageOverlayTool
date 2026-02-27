import {
    isOptionToken,
    normalizeArgv,
    parseOpacityPercent,
    requireOptionValue,
} from "./cliArgs";
import { CONTROL_COMMAND_OPTION_TOKENS } from "./cliOptionTokens";
import { resolveCliSubcommandArgv } from "./cliSubcommand";

type ParsedControlCommandKind =
    | "add-image"
    | "set-opacity"
    | "switch-scene"
    | "export";

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
          kind: "export";
          outputPath: string;
      };

const parseOpacityRatio = (value: string, optionName: string): number => {
    return parseOpacityPercent(value, optionName) / 100;
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
    let exportPath: string | null = null;
    let setOpacity: number | null = null;
    let addImageOpacity: number | undefined;

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

        if (token === "--export") {
            ensureSingleCommand(commandKind, "export");
            exportPath = requireOptionValue(argv, index, "--export");
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

    if (!exportPath) {
        throw new Error("--export requires an output path.");
    }

    return {
        kind: "export",
        outputPath: exportPath,
    };
};
