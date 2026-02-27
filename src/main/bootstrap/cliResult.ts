export const CLI_EXIT_CODES = {
    SUCCESS: 0,
    INVALID_ARGUMENT: 2,
    VALIDATION_FAILED: 3,
    EXECUTION_FAILED: 4,
} as const;

export type CliExitCode = (typeof CLI_EXIT_CODES)[keyof typeof CLI_EXIT_CODES];

export type CliOutputFormat = "text" | "json";

export interface CliJsonResult<TData = unknown> {
    ok: boolean;
    code: string;
    message: string;
    warnings: string[];
    data?: TData;
}

interface CreateCliResultOptions<TData> {
    code: string;
    message: string;
    warnings?: string[];
    data?: TData;
}

export const createCliSuccessResult = <TData = unknown>(
    options: CreateCliResultOptions<TData>
): CliJsonResult<TData> => ({
    ok: true,
    code: options.code,
    message: options.message,
    warnings: options.warnings ?? [],
    data: options.data,
});

export const createCliErrorResult = <TData = unknown>(
    options: CreateCliResultOptions<TData>
): CliJsonResult<TData> => ({
    ok: false,
    code: options.code,
    message: options.message,
    warnings: options.warnings ?? [],
    data: options.data,
});

export const stringifyCliJsonResult = <TData = unknown>(
    result: CliJsonResult<TData>
): string => JSON.stringify(result, null, 2);
