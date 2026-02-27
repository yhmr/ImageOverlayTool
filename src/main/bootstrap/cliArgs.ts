import fs from "fs";
import { isElectronInternalOption } from "./cliOptionTokens";
import { isCliSubcommand } from "./cliSubcommand";

const isLikelyAppEntryToken = (token: string): boolean => {
    if (token.startsWith("--")) {
        return false;
    }
    if (token.toLowerCase().endsWith(".js")) {
        return true;
    }
    try {
        return fs.existsSync(token) && fs.statSync(token).isDirectory();
    } catch {
        return false;
    }
};

const normalizeDevArgv = (commandLine: string[]): string[] => {
    const filtered = commandLine
        .slice(1)
        .filter((token) => !isElectronInternalOption(token));
    const subcommandIndex = filtered.findIndex(isCliSubcommand);

    if (
        subcommandIndex > 0 &&
        isLikelyAppEntryToken(filtered[subcommandIndex - 1])
    ) {
        const subcommand = filtered[subcommandIndex];
        const headArgs = filtered
            .slice(0, subcommandIndex)
            .filter((token) => !isLikelyAppEntryToken(token));
        const tailArgs = filtered.slice(subcommandIndex + 1);
        return [subcommand, ...headArgs, ...tailArgs];
    }

    if (filtered.length > 0 && isLikelyAppEntryToken(filtered[0])) {
        return filtered.slice(1);
    }

    return filtered;
};

export const normalizeArgv = (
    commandLine: string[],
    isPackaged: boolean
): string[] =>
    isPackaged ? commandLine.slice(1) : normalizeDevArgv(commandLine);

export const isOptionToken = (value: string): boolean => value.startsWith("--");

export const requireOptionValue = (
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

export const parseOpacityPercent = (
    value: string,
    optionName: string
): number => {
    const opacity = Number(value);
    if (!Number.isFinite(opacity) || opacity < 0 || opacity > 100) {
        throw new Error(`${optionName} must be between 0 and 100.`);
    }
    return opacity;
};
