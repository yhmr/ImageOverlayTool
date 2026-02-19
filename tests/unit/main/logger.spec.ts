import { describe, it, expect, vi, beforeEach } from "vitest";
import { app } from "electron";

// ホイスティングされたモックオブジェクト
const mocks = vi.hoisted(() => ({
    file: { level: "debug", maxSize: 0, format: "" },
    console: { level: "debug", format: "" },
    initialize: vi.fn(),
    hooks: { push: vi.fn() },
}));

// electron-log/main のモック
vi.mock("electron-log/main", () => ({
    default: {
        initialize: mocks.initialize,
        transports: {
            file: mocks.file,
            console: mocks.console,
        },
        hooks: mocks.hooks,
    },
}));

// electron のモック
vi.mock("electron", () => ({
    app: { isPackaged: false },
}));

describe("Logger Module", () => {
    beforeEach(() => {
        vi.resetModules();
        mocks.initialize.mockClear();
        mocks.hooks.push.mockClear();
        // モックの状態を初期値にリセット
        mocks.file.level = "debug";
        mocks.file.format = "";
        mocks.console.level = "debug";
        mocks.console.format = "";
    });

    describe("in test environment", () => {
        beforeEach(() => {
            process.env.NODE_ENV = "test";
        });

        it("should suppress logs", async () => {
            await import("@/main/logger");
            expect(mocks.file.level).toBe(false);
            expect(mocks.console.level).toBe(false);
        });
    });

    describe("in development environment", () => {
        beforeEach(() => {
            process.env.NODE_ENV = "development";
            // app.isPackaged = false (mock default)
        });

        it("should set debug level", async () => {
            await import("@/main/logger");
            expect(mocks.file.level).toBe("debug");
            expect(mocks.console.level).toBe("debug");
        });

        it("should set format to include processType", async () => {
            await import("@/main/logger");
            expect(mocks.file.format).toContain("[{processType}]");
            expect(mocks.console.format).toContain("[{processType}]");
        });
    });

    describe("in production environment", () => {
        beforeEach(() => {
            process.env.NODE_ENV = "production";
            (app.isPackaged as any) = true;
        });

        it("should set info level for file", async () => {
            await import("@/main/logger");
            expect(mocks.file.level).toBe("info");
            expect(mocks.console.level).toBe("debug");
        });
    });

    describe("Hook functionality", () => {
        beforeEach(() => {
            process.env.NODE_ENV = "development";
        });

        it("should register a hook", async () => {
            await import("@/main/logger");
            expect(mocks.hooks.push).toHaveBeenCalled();
        });

        it("should replace processType with scope if present", async () => {
            await import("@/main/logger");
            const hookPush = vi.mocked(mocks.hooks.push);
            expect(hookPush).toHaveBeenCalledWith(expect.any(Function));
            const [hookFn] = hookPush.mock.lastCall ?? [];
            if (typeof hookFn !== "function") {
                throw new Error("log hook should be registered");
            }

            // test case: has scope
            const msgWithScope = { scope: "renderer", variables: {} };
            const result1 = hookFn(msgWithScope);
            expect(result1.variables.processType).toBe("renderer");

            // test case: no scope
            const msgNoScope = { variables: { processType: "main" } };
            const result2 = hookFn(msgNoScope);
            // hookFn returns message, logic was: if scope exists, write to variables
            // if scope is undefined, it shouldn't touch variables
            expect(result2.variables.processType).toBe("main");
        });
    });
});
