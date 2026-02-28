import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CLI_EXIT_CODES } from "@/main/bootstrap/cliResult";
import {
    awaitControlCommandResult,
    buildControlAdditionalData,
    createControlCommandResultRequest,
    resolveControlCommandResultRequest,
    writeControlCommandExecutionFailedResult,
    writeControlCommandInvalidArgumentResult,
    writeControlCommandResultToProcess,
    writeControlCommandSuccessResult,
} from "@/main/bootstrap/controlCommandResult";

describe("controlCommandResult", () => {
    const cleanupPaths = new Set<string>();

    afterEach(() => {
        for (const filePath of cleanupPaths) {
            if (fs.existsSync(filePath)) {
                fs.rmSync(filePath, { force: true });
            }
        }
        cleanupPaths.clear();
    });

    it("creates and resolves control result request metadata", () => {
        const request = createControlCommandResultRequest();
        cleanupPaths.add(request.resultFilePath);

        expect(request.requestId.length).toBeGreaterThan(0);
        expect(path.dirname(request.resultFilePath)).toBe(os.tmpdir());

        const resolved = resolveControlCommandResultRequest(
            buildControlAdditionalData(request)
        );
        expect(resolved).toEqual(request);
    });

    it("writes success result and reads it back", async () => {
        const request = createControlCommandResultRequest();
        cleanupPaths.add(request.resultFilePath);

        await writeControlCommandSuccessResult(request);
        const payload = await awaitControlCommandResult(request);

        expect(payload.exitCode).toBe(CLI_EXIT_CODES.SUCCESS);
        expect(payload.result.ok).toBe(true);
        expect(payload.result.code).toBe("CLI_CONTROL_OK");
    });

    it("writes invalid/execution errors with mapped exit codes", async () => {
        const invalidRequest = createControlCommandResultRequest();
        const executionRequest = createControlCommandResultRequest();
        cleanupPaths.add(invalidRequest.resultFilePath);
        cleanupPaths.add(executionRequest.resultFilePath);

        await writeControlCommandInvalidArgumentResult(
            invalidRequest,
            new Error("invalid option")
        );
        await writeControlCommandExecutionFailedResult(
            executionRequest,
            new Error("command failed")
        );

        const invalidPayload = await awaitControlCommandResult(invalidRequest);
        const executionPayload =
            await awaitControlCommandResult(executionRequest);

        expect(invalidPayload.exitCode).toBe(CLI_EXIT_CODES.INVALID_ARGUMENT);
        expect(invalidPayload.result.code).toBe("CLI_CONTROL_INVALID_ARGUMENT");
        expect(executionPayload.exitCode).toBe(CLI_EXIT_CODES.EXECUTION_FAILED);
        expect(executionPayload.result.code).toBe("CLI_CONTROL_EXECUTION_FAILED");
    });

    it("writes result to stdout/stderr by ok flag", async () => {
        const request = createControlCommandResultRequest();
        cleanupPaths.add(request.resultFilePath);
        await writeControlCommandSuccessResult(request);
        const payload = await awaitControlCommandResult(request);

        const stdoutSpy = vi
            .spyOn(process.stdout, "write")
            .mockImplementation(() => true);
        const stderrSpy = vi
            .spyOn(process.stderr, "write")
            .mockImplementation(() => true);

        writeControlCommandResultToProcess(payload);

        expect(stdoutSpy).toHaveBeenCalledOnce();
        expect(stderrSpy).not.toHaveBeenCalled();

        stdoutSpy.mockRestore();
        stderrSpy.mockRestore();
    });
});
