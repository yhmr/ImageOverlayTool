import crypto from "crypto";
import fs from "fs";
import os from "os";
import path from "path";

import {
    CLI_EXIT_CODES,
    createCliErrorResult,
    createCliSuccessResult,
    stringifyCliJsonResult,
    type CliExitCode,
    type CliJsonResult,
} from "./cliResult";

const CONTROL_RESULT_FILE_PREFIX = "iot-control-result-";
const CONTROL_RESULT_DEFAULT_TIMEOUT_MS = 15000;
const CONTROL_RESULT_POLL_MS = 50;

export interface ControlCommandResultRequest {
    requestId: string;
    resultFilePath: string;
}

interface ControlCommandResultFilePayload {
    exitCode: CliExitCode;
    result: CliJsonResult;
}

type AdditionalDataContainer = {
    controlResult?: unknown;
    parsedCommand?: unknown;
};

const isNonEmptyString = (value: unknown): value is string =>
    typeof value === "string" && value.trim().length > 0;

const toErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
        return error.message;
    }
    if (
        typeof error === "object" &&
        error !== null &&
        typeof (error as { message?: unknown }).message === "string"
    ) {
        return (error as { message: string }).message;
    }
    return String(error);
};

const sleep = async (ms: number): Promise<void> => {
    await new Promise<void>((resolve) => {
        setTimeout(resolve, ms);
    });
};

const validateRequest = (
    candidate: unknown
): ControlCommandResultRequest | null => {
    if (!candidate || typeof candidate !== "object") {
        return null;
    }

    const value = candidate as {
        requestId?: unknown;
        resultFilePath?: unknown;
    };

    if (!isNonEmptyString(value.requestId)) {
        return null;
    }
    if (!isNonEmptyString(value.resultFilePath)) {
        return null;
    }

    return {
        requestId: value.requestId,
        resultFilePath: value.resultFilePath,
    };
};

const writeResultFile = async (
    request: ControlCommandResultRequest,
    payload: ControlCommandResultFilePayload
): Promise<void> => {
    await fs.promises.mkdir(path.dirname(request.resultFilePath), {
        recursive: true,
    });
    const tempFilePath = `${request.resultFilePath}.tmp`;
    await fs.promises.writeFile(tempFilePath, JSON.stringify(payload), "utf8");
    await fs.promises.rename(tempFilePath, request.resultFilePath);
};

const parseResultFilePayload = (
    raw: string
): ControlCommandResultFilePayload => {
    const parsed = JSON.parse(raw) as {
        exitCode?: unknown;
        result?: unknown;
    };
    if (typeof parsed.exitCode !== "number") {
        throw new Error("Invalid control result payload: missing exitCode.");
    }
    if (!parsed.result || typeof parsed.result !== "object") {
        throw new Error("Invalid control result payload: missing result.");
    }
    return {
        exitCode: parsed.exitCode as CliExitCode,
        result: parsed.result as CliJsonResult,
    };
};

export const createControlCommandResultRequest =
    (): ControlCommandResultRequest => {
        const requestId =
            typeof crypto.randomUUID === "function"
                ? crypto.randomUUID()
                : `${Date.now()}-${Math.random()}`;
        return {
            requestId,
            resultFilePath: path.join(
                os.tmpdir(),
                `${CONTROL_RESULT_FILE_PREFIX}${requestId}.json`
            ),
        };
    };

export const buildControlAdditionalData = (
    request: ControlCommandResultRequest,
    parsedCommand?: unknown
): AdditionalDataContainer => ({
    controlResult: request,
    parsedCommand: parsedCommand ?? undefined,
});

export const resolveControlCommandResultRequest = (
    additionalData: unknown
): ControlCommandResultRequest | null => {
    if (!additionalData || typeof additionalData !== "object") {
        return null;
    }
    const container = additionalData as AdditionalDataContainer;
    return validateRequest(container.controlResult);
};

export const resolveParsedCommand = (additionalData: unknown): unknown => {
    if (!additionalData || typeof additionalData !== "object") {
        return undefined;
    }
    const container = additionalData as AdditionalDataContainer;
    return container.parsedCommand;
};

export const writeControlCommandSuccessResult = async (
    request: ControlCommandResultRequest,
    options: { message?: string } = {}
): Promise<void> => {
    await writeResultFile(request, {
        exitCode: CLI_EXIT_CODES.SUCCESS,
        result: createCliSuccessResult({
            code: "CLI_CONTROL_OK",
            message: options.message ?? "Control command executed.",
        }),
    });
};

export const writeControlCommandInvalidArgumentResult = async (
    request: ControlCommandResultRequest,
    error: unknown
): Promise<void> => {
    await writeResultFile(request, {
        exitCode: CLI_EXIT_CODES.INVALID_ARGUMENT,
        result: createCliErrorResult({
            code: "CLI_CONTROL_INVALID_ARGUMENT",
            message: toErrorMessage(error),
        }),
    });
};

export const writeControlCommandExecutionFailedResult = async (
    request: ControlCommandResultRequest,
    error: unknown
): Promise<void> => {
    await writeResultFile(request, {
        exitCode: CLI_EXIT_CODES.EXECUTION_FAILED,
        result: createCliErrorResult({
            code: "CLI_CONTROL_EXECUTION_FAILED",
            message: toErrorMessage(error),
        }),
    });
};

export const awaitControlCommandResult = async (
    request: ControlCommandResultRequest,
    timeoutMs?: number
): Promise<ControlCommandResultFilePayload> => {
    const effectiveTimeout = timeoutMs ?? CONTROL_RESULT_DEFAULT_TIMEOUT_MS;
    const deadline = Date.now() + effectiveTimeout;

    while (Date.now() < deadline) {
        if (fs.existsSync(request.resultFilePath)) {
            const raw = await fs.promises.readFile(
                request.resultFilePath,
                "utf8"
            );
            await fs.promises.unlink(request.resultFilePath).catch(() => {
                // noop
            });
            return parseResultFilePayload(raw);
        }
        const waitMs = Math.min(
            CONTROL_RESULT_POLL_MS,
            Math.max(1, deadline - Date.now())
        );
        await sleep(waitMs);
    }

    throw new Error(
        `Timed out waiting for control command result after ${effectiveTimeout}ms.`
    );
};

export const writeControlCommandResultToProcess = (
    payload: ControlCommandResultFilePayload
): void => {
    const serialized = `${stringifyCliJsonResult(payload.result)}\n`;
    if (payload.result.ok) {
        process.stdout.write(serialized);
    } else {
        process.stderr.write(serialized);
    }
};
