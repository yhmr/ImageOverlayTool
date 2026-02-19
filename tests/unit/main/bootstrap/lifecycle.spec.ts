import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { app, crashReporter, dialog } from "electron";

import { registerProcessErrorHandlers } from "@/main/bootstrap/lifecycle";

vi.mock("electron", () => ({
    app: {
        on: vi.fn(),
        isPackaged: false,
    },
    crashReporter: {
        start: vi.fn(),
    },
    dialog: {
        showErrorBox: vi.fn(),
    },
}));

vi.mock("@/main/logger", () => ({
    default: {
        error: vi.fn(),
        info: vi.fn(),
    },
}));

describe("lifecycle", () => {
    let processOnSpy: ReturnType<typeof vi.spyOn>;
    let uncaughtExceptionCallback: ((error: Error) => void) | null;
    let unhandledRejectionCallback: ((reason: unknown) => void) | null;

    beforeEach(() => {
        vi.clearAllMocks();
        uncaughtExceptionCallback = null;
        unhandledRejectionCallback = null;

        processOnSpy = vi
            .spyOn(process, "on")
            .mockImplementation(
                ((event: string | symbol, listener: (...args: unknown[]) => void) => {
                    if (event === "uncaughtException") {
                        uncaughtExceptionCallback = listener as (error: Error) => void;
                    }
                    if (event === "unhandledRejection") {
                        unhandledRejectionCallback = listener as (
                            reason: unknown
                        ) => void;
                    }
                    return process;
                }) as typeof process.on
            );
    });

    afterEach(() => {
        processOnSpy.mockRestore();
    });

    it("should register error handlers and crash reporter", () => {
        registerProcessErrorHandlers();

        expect(crashReporter.start).toHaveBeenCalled();
        expect(process.on).toHaveBeenCalledWith(
            "uncaughtException",
            expect.any(Function)
        );
        expect(process.on).toHaveBeenCalledWith(
            "unhandledRejection",
            expect.any(Function)
        );
        expect(app.on).toHaveBeenCalledWith(
            "render-process-gone",
            expect.any(Function)
        );
        expect(app.on).toHaveBeenCalledWith(
            "child-process-gone",
            expect.any(Function)
        );
    });

    it("should show error dialog on uncaughtException", () => {
        registerProcessErrorHandlers();

        const error = new Error("Test Error");
        uncaughtExceptionCallback?.(error);

        expect(dialog.showErrorBox).toHaveBeenCalledWith(
            "An unexpected error occurred",
            expect.stringContaining("Test Error")
        );
    });

    it("should show error dialog on unhandledRejection", () => {
        registerProcessErrorHandlers();

        const reason = "Test Rejection Reason";
        unhandledRejectionCallback?.(reason);

        expect(dialog.showErrorBox).toHaveBeenCalledWith(
            "An unexpected error occurred",
            expect.stringContaining("Test Rejection Reason")
        );
    });
});

