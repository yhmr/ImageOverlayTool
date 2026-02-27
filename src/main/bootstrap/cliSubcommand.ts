export type CliSubcommand = "startup" | "control";
const CLI_SUBCOMMANDS = new Set<CliSubcommand>(["startup", "control"]);

export interface ResolvedCliSubcommandArgv {
    subcommand: CliSubcommand | null;
    argv: string[];
}

export const isCliSubcommand = (value: string): value is CliSubcommand =>
    CLI_SUBCOMMANDS.has(value.toLowerCase() as CliSubcommand);

export const resolveCliSubcommandArgv = (
    argv: string[]
): ResolvedCliSubcommandArgv => {
    const firstToken = argv[0]?.toLowerCase();
    if (firstToken && isCliSubcommand(firstToken)) {
        return {
            subcommand: firstToken,
            argv: argv.slice(1),
        };
    }

    return {
        subcommand: null,
        argv,
    };
};
