import { describe, expect, it } from "vitest";

import {
    CLI_EXIT_CODES,
    createCliErrorResult,
    createCliSuccessResult,
    stringifyCliJsonResult,
} from "@/main/bootstrap/cliResult";

describe("cliResult", () => {
    it("defines stable exit code mapping", () => {
        expect(CLI_EXIT_CODES).toEqual({
            SUCCESS: 0,
            INVALID_ARGUMENT: 2,
            VALIDATION_FAILED: 3,
            EXECUTION_FAILED: 4,
        });
    });

    it("creates success result with defaults", () => {
        expect(
            createCliSuccessResult({
                code: "CLI_HELP",
                message: "ok",
            })
        ).toEqual({
            ok: true,
            code: "CLI_HELP",
            message: "ok",
            warnings: [],
            data: undefined,
        });
    });

    it("creates error result with warnings/data", () => {
        expect(
            createCliErrorResult({
                code: "CLI_INVALID_ARGUMENT",
                message: "invalid",
                warnings: ["w1"],
                data: { reasonCode: "HELP_UNKNOWN_TOPIC" },
            })
        ).toEqual({
            ok: false,
            code: "CLI_INVALID_ARGUMENT",
            message: "invalid",
            warnings: ["w1"],
            data: { reasonCode: "HELP_UNKNOWN_TOPIC" },
        });
    });

    it("serializes result as pretty JSON", () => {
        const json = stringifyCliJsonResult(
            createCliSuccessResult({
                code: "CLI_HELP",
                message: "help",
                data: { topic: "all" },
            })
        );

        const parsed = JSON.parse(json) as {
            ok: boolean;
            code: string;
            message: string;
            warnings: string[];
            data: { topic: string };
        };

        expect(parsed).toEqual({
            ok: true,
            code: "CLI_HELP",
            message: "help",
            warnings: [],
            data: { topic: "all" },
        });
    });
});
