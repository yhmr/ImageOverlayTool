const APP_ARGS_JSON_ENV = "IOT_APP_ARGS_JSON";
const RUNTIME_ONLY_APP_ARGS = new Set(["--e2e"]);

const ensureStringArray = (value: unknown, source: string): string[] => {
    if (
        !Array.isArray(value) ||
        value.some((item) => typeof item !== "string")
    ) {
        throw new Error(`${source} must be a JSON array of strings.`);
    }

    return [...value];
};

export const resolveAppArgsFromEnv = (
    env: NodeJS.ProcessEnv = process.env
): string[] => {
    const raw = env[APP_ARGS_JSON_ENV];
    if (!raw || raw.trim().length === 0) {
        return [];
    }

    let parsed: unknown;
    try {
        parsed = JSON.parse(raw);
    } catch {
        throw new Error(`${APP_ARGS_JSON_ENV} must be valid JSON.`);
    }

    return ensureStringArray(parsed, APP_ARGS_JSON_ENV);
};

export const resolveAppArgsFromSecondInstanceData = (
    additionalData: unknown
): string[] => {
    if (!additionalData || typeof additionalData !== "object") {
        return [];
    }

    const appArgs = (
        additionalData as {
            appArgs?: unknown;
        }
    ).appArgs;

    if (appArgs === undefined) {
        return [];
    }

    return ensureStringArray(appArgs, "second-instance additionalData.appArgs");
};

export const stripRuntimeOnlyAppArgs = (appArgs: string[]): string[] =>
    appArgs.filter((token) => !RUNTIME_ONLY_APP_ARGS.has(token));

export const toSyntheticCommandLine = (
    appArgs: string[],
    isPackaged: boolean
): string[] =>
    isPackaged
        ? ["ImageOverlayTool.exe", ...appArgs]
        : ["node", "index.js", ...appArgs];
