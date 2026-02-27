import type { Point } from "../../shared/types/Point";
import type { Size } from "../../shared/types/Size";
import { isOptionToken, normalizeArgv, parseOpacityPercent } from "./cliArgs";
import { STARTUP_OPTION_TOKENS } from "./cliOptionTokens";
import { resolveCliSubcommandArgv } from "./cliSubcommand";

export interface ParsedStartupArgs {
    scenePath?: string;
    images: string[];
    positionalPath?: string;
    opacity?: number;
    position?: Point;
    size?: Size;
    alwaysOnTop: boolean;
    clickThrough: boolean;
    fullscreen: boolean;
    silent: boolean;
    minimize: boolean;
}

const parseCommaSeparatedPair = (
    value: string,
    optionName: string
): [number, number] => {
    const [rawA, rawB] = value.split(",");
    if (rawA === undefined || rawB === undefined) {
        throw new Error(`${optionName} must be in "a,b" format.`);
    }

    const a = Number(rawA);
    const b = Number(rawB);
    if (!Number.isFinite(a) || !Number.isFinite(b)) {
        throw new Error(`${optionName} must contain finite numeric values.`);
    }

    return [a, b];
};

const parseOpacity = (value: string): number => {
    return parseOpacityPercent(value, "--opacity");
};

const parsePosition = (value: string): Point => {
    const [x, y] = parseCommaSeparatedPair(value, "--position");
    return { x, y };
};

const parseSize = (value: string): Size => {
    const [width, height] = parseCommaSeparatedPair(value, "--size");
    if (width <= 0 || height <= 0) {
        throw new Error("--size must be positive values.");
    }
    return { width, height };
};

const isStartupOptionToken = (token: string): boolean =>
    STARTUP_OPTION_TOKENS.has(token);

const looksLikePathCandidate = (value: string): boolean =>
    value.includes("/") ||
    value.includes("\\") ||
    value.startsWith(".") ||
    /\.[a-z0-9]+$/i.test(value);

export const parseStartupArgs = (
    commandLine: string[],
    isPackaged: boolean
): ParsedStartupArgs => {
    const normalizedArgv = normalizeArgv(commandLine, isPackaged);
    const { subcommand, argv } = resolveCliSubcommandArgv(normalizedArgv);
    const hasStartupOptionToken = argv.some(isStartupOptionToken);
    const hasOptionToken = argv.some(isOptionToken);
    const allowUnknownOptions = subcommand === null;
    if (subcommand === "control") {
        throw new Error(
            "control subcommand cannot be used with startup options."
        );
    }
    if (subcommand === null && hasStartupOptionToken) {
        throw new Error('Startup options require the "startup" subcommand.');
    }
    const positional: string[] = [];

    const parsed: ParsedStartupArgs = {
        images: [],
        alwaysOnTop: false,
        clickThrough: false,
        fullscreen: false,
        silent: false,
        minimize: false,
    };

    for (let index = 0; index < argv.length; index += 1) {
        const token = argv[index];

        if (!isOptionToken(token)) {
            positional.push(token);
            continue;
        }

        if (token === "--scene") {
            const value = argv[index + 1];
            if (!value || isOptionToken(value)) {
                throw new Error("--scene requires a path.");
            }
            parsed.scenePath = value;
            index += 1;
            continue;
        }

        if (token === "--images") {
            const values: string[] = [];
            while (argv[index + 1] && !isOptionToken(argv[index + 1])) {
                values.push(argv[index + 1]);
                index += 1;
            }
            if (values.length === 0) {
                throw new Error("--images requires one or more paths.");
            }
            parsed.images.push(...values);
            continue;
        }

        if (token === "--opacity") {
            const value = argv[index + 1];
            if (!value || isOptionToken(value)) {
                throw new Error("--opacity requires a numeric value.");
            }
            parsed.opacity = parseOpacity(value);
            index += 1;
            continue;
        }

        if (token === "--position") {
            const value = argv[index + 1];
            if (!value || isOptionToken(value)) {
                throw new Error("--position requires x,y.");
            }
            parsed.position = parsePosition(value);
            index += 1;
            continue;
        }

        if (token === "--size") {
            const value = argv[index + 1];
            if (!value || isOptionToken(value)) {
                throw new Error("--size requires w,h.");
            }
            parsed.size = parseSize(value);
            index += 1;
            continue;
        }

        if (token === "--always-on-top") {
            parsed.alwaysOnTop = true;
            continue;
        }

        if (token === "--click-through") {
            parsed.clickThrough = true;
            continue;
        }

        if (token === "--fullscreen") {
            parsed.fullscreen = true;
            continue;
        }

        if (token === "--silent") {
            parsed.silent = true;
            continue;
        }

        if (token === "--minimize") {
            parsed.minimize = true;
            continue;
        }

        if (token === "--e2e") {
            continue;
        }

        if (allowUnknownOptions) {
            continue;
        }

        throw new Error(`Unknown startup option: ${token}`);
    }

    if (positional.length > 1) {
        if (allowUnknownOptions) {
            return parsed;
        }
        throw new Error("Only one positional file path is supported.");
    }

    if (positional.length === 1) {
        if (
            allowUnknownOptions &&
            hasOptionToken &&
            !looksLikePathCandidate(positional[0])
        ) {
            return parsed;
        }
        parsed.positionalPath = positional[0];
    }

    return parsed;
};
