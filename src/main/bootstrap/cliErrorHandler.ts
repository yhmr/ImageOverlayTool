import { dialog } from "electron";

import log from "../logger";
import { CliRouteParseError } from "./cliRouter";
import {
    createCliErrorResult,
    stringifyCliJsonResult,
    type CliOutputFormat,
} from "./cliResult";

interface CliParseErrorLike {
    code: string;
    formatHint: CliOutputFormat;
}

const isCliParseErrorLike = (error: unknown): error is CliParseErrorLike =>
    typeof error === "object" &&
    error !== null &&
    typeof (error as { code?: unknown }).code === "string" &&
    ((error as { formatHint?: unknown }).formatHint === "json" ||
        (error as { formatHint?: unknown }).formatHint === "text");

export const toErrorMessage = (error: unknown): string => {
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

export const writeCliInvalidArgumentError = (error: unknown): void => {
    const message = toErrorMessage(error);
    if (isCliParseErrorLike(error) && error.formatHint === "json") {
        process.stderr.write(
            `${stringifyCliJsonResult(
                createCliErrorResult({
                    code: "CLI_INVALID_ARGUMENT",
                    message,
                    data: {
                        reasonCode: error.code,
                    },
                })
            )}\n`
        );
        return;
    }

    process.stderr.write(`${message}\n`);
};

export const writeCliSceneValidationError = (
    scenePath: string,
    format: CliOutputFormat,
    error: unknown
): void => {
    const message = toErrorMessage(error);
    if (format === "json") {
        process.stderr.write(
            `${stringifyCliJsonResult(
                createCliErrorResult({
                    code: "CLI_SCENE_VALIDATION_FAILED",
                    message,
                    data: {
                        scenePath,
                        errors: [{ message }],
                    },
                })
            )}\n`
        );
        return;
    }

    process.stderr.write(`Scene validation failed: ${message}\n`);
};

export const reportStartupLaunchParseError = (error: unknown): void => {
    const message = toErrorMessage(error);
    log.error("Failed to parse startup launch options.", { message });
    dialog.showErrorBox("Invalid startup options", message);
};

export const reportSecondInstanceRouteParseError = (error: unknown): void => {
    const message = toErrorMessage(error);
    const isControlParseError =
        error instanceof CliRouteParseError && error.stage === "control";

    log.error(
        isControlParseError
            ? "Failed to parse second-instance command options."
            : "Failed to parse second-instance startup options.",
        { message }
    );
    dialog.showErrorBox(
        isControlParseError
            ? "Invalid second-instance command"
            : "Invalid startup options",
        message
    );
};

export const reportSecondInstanceCommandExecutionError = (
    error: unknown
): void => {
    const message = toErrorMessage(error);
    log.error("Failed to execute second-instance command.", {
        message,
    });
    dialog.showErrorBox("Second-instance command failed", message);
};
