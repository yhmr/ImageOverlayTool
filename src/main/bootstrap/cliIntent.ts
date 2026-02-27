import { normalizeArgv } from "./cliArgs";
import { CONTROL_COMMAND_OPTION_TOKENS } from "./cliOptionTokens";
import { resolveCliSubcommandArgv } from "./cliSubcommand";

export const isFlatControlCommandInvocation = (
    commandLine: string[],
    isPackaged: boolean
): boolean => {
    const normalizedArgv = normalizeArgv(commandLine, isPackaged);
    const { subcommand, argv } = resolveCliSubcommandArgv(normalizedArgv);
    return (
        subcommand === null &&
        argv.some((token) => CONTROL_COMMAND_OPTION_TOKENS.has(token))
    );
};
