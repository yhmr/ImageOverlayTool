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

type ControlParseState = {
    commandKind: ParsedControlCommandKind | null;
    addImagePath: string | null;
    switchScenePath: string | null;
    captureWindowPath: string | null;
    saveStagePath: string | null;
    setOpacity: number | null;
    addImageOpacity: number | undefined;
    waitStableTimeoutMs: number | null;
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

const createInitialState = (): ControlParseState => ({
    commandKind: null,
    addImagePath: null,
    switchScenePath: null,
    captureWindowPath: null,
    saveStagePath: null,
    setOpacity: null,
    addImageOpacity: undefined,
    waitStableTimeoutMs: null,
});

const setCommandKind = (
    state: ControlParseState,
    nextKind: ParsedControlCommandKind
): void => {
    ensureSingleCommand(state.commandKind, nextKind);
    state.commandKind = nextKind;
};

const consumeControlOption = (
    argv: string[],
    index: number,
    state: ControlParseState
): number | null => {
    const token = argv[index];

    if (token === "--add-image") {
        setCommandKind(state, "add-image");
        state.addImagePath = requireOptionValue(argv, index, "--add-image");
        return 1;
    }

    if (token === "--set-opacity") {
        setCommandKind(state, "set-opacity");
        state.setOpacity = parseOpacityRatio(
            requireOptionValue(argv, index, "--set-opacity"),
            "--set-opacity"
        );
        return 1;
    }

    if (token === "--switch-scene") {
        setCommandKind(state, "switch-scene");
        state.switchScenePath = requireOptionValue(
            argv,
            index,
            "--switch-scene"
        );
        return 1;
    }

    if (token === "--capture-window") {
        setCommandKind(state, "capture-window");
        state.captureWindowPath = requireOptionValue(
            argv,
            index,
            "--capture-window"
        );
        return 1;
    }

    if (token === "--save-stage") {
        setCommandKind(state, "save-stage");
        state.saveStagePath = requireOptionValue(argv, index, "--save-stage");
        return 1;
    }

    if (token === "--wait-stable") {
        setCommandKind(state, "wait-stable");
        return 0;
    }

    if (token === "--opacity") {
        state.addImageOpacity = parseOpacityRatio(
            requireOptionValue(argv, index, "--opacity"),
            "--opacity"
        );
        return 1;
    }

    if (token === "--timeout-ms") {
        state.waitStableTimeoutMs = parseTimeoutMs(
            requireOptionValue(argv, index, "--timeout-ms")
        );
        return 1;
    }

    return null;
};

const validateControlOptionConstraints = (state: ControlParseState): void => {
    if (
        state.addImageOpacity !== undefined &&
        state.commandKind !== "add-image"
    ) {
        throw new Error("--opacity can only be used with --add-image.");
    }

    if (
        state.waitStableTimeoutMs !== null &&
        state.commandKind !== "wait-stable"
    ) {
        throw new Error("--timeout-ms can only be used with --wait-stable.");
    }
};

const buildParsedControlCommand = (
    state: ControlParseState
): ParsedControlCommand | null => {
    if (!state.commandKind) {
        return null;
    }

    switch (state.commandKind) {
        case "add-image":
            if (!state.addImagePath) {
                throw new Error("--add-image requires a path.");
            }
            return {
                kind: "add-image",
                imagePath: state.addImagePath,
                opacity: state.addImageOpacity,
            };
        case "set-opacity":
            if (state.setOpacity === null) {
                throw new Error("--set-opacity requires a numeric value.");
            }
            return {
                kind: "set-opacity",
                opacity: state.setOpacity,
            };
        case "switch-scene":
            if (!state.switchScenePath) {
                throw new Error("--switch-scene requires a path.");
            }
            return {
                kind: "switch-scene",
                scenePath: state.switchScenePath,
            };
        case "capture-window":
            if (!state.captureWindowPath) {
                throw new Error("--capture-window requires an output path.");
            }
            return {
                kind: "capture-window",
                outputPath: state.captureWindowPath,
            };
        case "save-stage":
            if (!state.saveStagePath) {
                throw new Error("--save-stage requires an output path.");
            }
            return {
                kind: "save-stage",
                outputPath: state.saveStagePath,
            };
        case "wait-stable":
            return {
                kind: "wait-stable",
                timeoutMs:
                    state.waitStableTimeoutMs ?? DEFAULT_WAIT_STABLE_TIMEOUT_MS,
            };
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

    const parseState = createInitialState();

    for (let index = 0; index < argv.length; index += 1) {
        const consumedTokens = consumeControlOption(argv, index, parseState);
        if (consumedTokens !== null) {
            index += consumedTokens;
            continue;
        }

        const token = argv[index];
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

    validateControlOptionConstraints(parseState);
    return buildParsedControlCommand(parseState);
};
