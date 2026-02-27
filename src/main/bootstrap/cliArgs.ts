export const normalizeArgv = (
    commandLine: string[],
    isPackaged: boolean
): string[] => (isPackaged ? commandLine.slice(1) : commandLine.slice(2));

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
