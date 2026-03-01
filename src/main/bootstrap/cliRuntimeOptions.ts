import { normalizeArgv } from "./cliArgs";
import { GLOBAL_OPTION_TOKENS } from "./cliOptionTokens";

export interface CliRuntimeOptions {
    interactive: boolean;
}

export const resolveCliRuntimeOptions = (
    commandLine: string[],
    isPackaged: boolean
): CliRuntimeOptions => {
    const argv = normalizeArgv(commandLine, isPackaged);
    const isNonInteractive = argv.some(
        (token) =>
            token === "--non-interactive" && GLOBAL_OPTION_TOKENS.has(token)
    );

    return {
        interactive: !isNonInteractive,
    };
};
