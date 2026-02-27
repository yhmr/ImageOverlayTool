import { beforeEach, describe, expect, it, vi } from "vitest";
import { dialog } from "electron";

import log from "@/main/logger";
import { CliRouteParseError } from "@/main/bootstrap/cliRouter";
import {
    reportSecondInstanceCommandExecutionError,
    reportSecondInstanceRouteParseError,
    reportStartupLaunchParseError,
    writeCliInvalidArgumentError,
    writeCliSceneValidationError,
} from "@/main/bootstrap/cliErrorHandler";

vi.mock("electron", () => ({
    dialog: {
        showErrorBox: vi.fn(),
    },
}));

vi.mock("@/main/logger", () => ({
    default: {
        error: vi.fn(),
        warn: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
    },
}));

describe("cliErrorHandler", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("writes json invalid-argument payload when parse error has json format hint", () => {
        const stderrSpy = vi
            .spyOn(process.stderr, "write")
            .mockImplementation(() => true);

        writeCliInvalidArgumentError({
            message: "Unknown help topic",
            code: "HELP_UNKNOWN_TOPIC",
            formatHint: "json",
        });

        expect(stderrSpy).toHaveBeenCalledTimes(1);
        const output = String(stderrSpy.mock.calls[0]?.[0] ?? "");
        const parsed = JSON.parse(output) as {
            ok: boolean;
            code: string;
            message: string;
            data: { reasonCode: string };
        };
        expect(parsed.ok).toBe(false);
        expect(parsed.code).toBe("CLI_INVALID_ARGUMENT");
        expect(parsed.message).toBe("Unknown help topic");
        expect(parsed.data.reasonCode).toBe("HELP_UNKNOWN_TOPIC");

        stderrSpy.mockRestore();
    });

    it("writes plain invalid-argument error text when no json hint exists", () => {
        const stderrSpy = vi
            .spyOn(process.stderr, "write")
            .mockImplementation(() => true);

        writeCliInvalidArgumentError(new Error("invalid option"));

        expect(stderrSpy).toHaveBeenCalledWith("invalid option\n");
        stderrSpy.mockRestore();
    });

    it("writes json scene-validation error payload", () => {
        const stderrSpy = vi
            .spyOn(process.stderr, "write")
            .mockImplementation(() => true);

        writeCliSceneValidationError(
            "C:/tmp/sample.scene.json",
            "json",
            new Error("Scene image file not found")
        );

        const output = String(stderrSpy.mock.calls[0]?.[0] ?? "");
        const parsed = JSON.parse(output) as {
            code: string;
            data: { scenePath: string; errors: Array<{ message: string }> };
        };
        expect(parsed.code).toBe("CLI_SCENE_VALIDATION_FAILED");
        expect(parsed.data.scenePath).toBe("C:/tmp/sample.scene.json");
        expect(parsed.data.errors[0]?.message).toBe("Scene image file not found");

        stderrSpy.mockRestore();
    });

    it("writes text scene-validation error when format is text", () => {
        const stderrSpy = vi
            .spyOn(process.stderr, "write")
            .mockImplementation(() => true);

        writeCliSceneValidationError(
            "C:/tmp/sample.scene.json",
            "text",
            new Error("schema invalid")
        );

        expect(stderrSpy).toHaveBeenCalledWith(
            "Scene validation failed: schema invalid\n"
        );
        stderrSpy.mockRestore();
    });

    it("reports startup launch parse error to log and dialog", () => {
        reportStartupLaunchParseError(new Error("invalid startup option"));

        expect(log.error).toHaveBeenCalledWith(
            "Failed to parse startup launch options.",
            { message: "invalid startup option" }
        );
        expect(dialog.showErrorBox).toHaveBeenCalledWith(
            "Invalid startup options",
            "invalid startup option"
        );
    });

    it("reports control route parse error with command dialog title", () => {
        reportSecondInstanceRouteParseError(
            new CliRouteParseError("control", "invalid command option")
        );

        expect(log.error).toHaveBeenCalledWith(
            "Failed to parse second-instance command options.",
            { message: "invalid command option" }
        );
        expect(dialog.showErrorBox).toHaveBeenCalledWith(
            "Invalid second-instance command",
            "invalid command option"
        );
    });

    it("reports startup route parse error with startup dialog title", () => {
        reportSecondInstanceRouteParseError(
            new CliRouteParseError("startup", "invalid startup option")
        );

        expect(log.error).toHaveBeenCalledWith(
            "Failed to parse second-instance startup options.",
            { message: "invalid startup option" }
        );
        expect(dialog.showErrorBox).toHaveBeenCalledWith(
            "Invalid startup options",
            "invalid startup option"
        );
    });

    it("reports second-instance command execution error", () => {
        reportSecondInstanceCommandExecutionError(new Error("export failed"));

        expect(log.error).toHaveBeenCalledWith(
            "Failed to execute second-instance command.",
            { message: "export failed" }
        );
        expect(dialog.showErrorBox).toHaveBeenCalledWith(
            "Second-instance command failed",
            "export failed"
        );
    });
});
