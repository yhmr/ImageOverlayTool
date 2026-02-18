import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { dialog, crashReporter, app } from "electron";
import { registerProcessErrorHandlers } from "@/main/bootstrap/lifecycle";

// Electronのモック
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

// loggerのモック
vi.mock("@/main/logger", () => ({
    default: {
        error: vi.fn(),
        info: vi.fn(),
    },
}));

describe("lifecycle", () => {
    let processOnSpy: any;
    let uncaughtExceptionCallback: (error: Error) => void;
    let unhandledRejectionCallback: (reason: any) => void;

    beforeEach(() => {
        vi.clearAllMocks();

        // process.on をスパイしてコールバックをキャプチャする
        processOnSpy = vi.spyOn(process, "on").mockImplementation((event, listener) => {
            if (event === "uncaughtException") {
                uncaughtExceptionCallback = listener as any;
            }
            if (event === "unhandledRejection") {
                unhandledRejectionCallback = listener as any;
            }
            return process;
        });
    });

    afterEach(() => {
        processOnSpy.mockRestore();
    });

    it("should register error handlers and crash reporter", () => {
        registerProcessErrorHandlers();

        expect(crashReporter.start).toHaveBeenCalled();
        expect(process.on).toHaveBeenCalledWith("uncaughtException", expect.any(Function));
        expect(process.on).toHaveBeenCalledWith("unhandledRejection", expect.any(Function));
        expect(app.on).toHaveBeenCalledWith("render-process-gone", expect.any(Function));
        expect(app.on).toHaveBeenCalledWith("child-process-gone", expect.any(Function));
    });

    it("should show error dialog on uncaughtException", () => {
        registerProcessErrorHandlers();

        const error = new Error("Test Error");
        // キャプチャしたコールバックを実行
        if (uncaughtExceptionCallback) {
            uncaughtExceptionCallback(error);
        }

        expect(dialog.showErrorBox).toHaveBeenCalledWith(
            "An unexpected error occurred",
            expect.stringContaining("Test Error")
        );
    });

    it("should show error dialog on unhandledRejection", () => {
        registerProcessErrorHandlers();

        const reason = "Test Rejection Reason";
        // キャプチャしたコールバックを実行
        if (unhandledRejectionCallback) {
            unhandledRejectionCallback(reason);
        }

        expect(dialog.showErrorBox).toHaveBeenCalledWith(
            "An unexpected error occurred",
            expect.stringContaining("Test Rejection Reason")
        );
    });
});
