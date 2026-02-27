export type CliSubcommand = "startup" | "control";

export interface ResolvedCliSubcommandArgv {
    subcommand: CliSubcommand | null;
    argv: string[];
}

export const resolveCliSubcommandArgv = (
    argv: string[]
): ResolvedCliSubcommandArgv => {
    const firstToken = argv[0]?.toLowerCase();
    if (firstToken === "startup" || firstToken === "control") {
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
