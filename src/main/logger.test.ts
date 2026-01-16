import { describe, it, expect, vi, beforeEach } from "vitest";
import { app } from "electron";

// ホイスティングされたモックオブジェクト
const mocks = vi.hoisted(() => ({
    file: { level: "debug", maxSize: 0, format: "" },
    console: { level: "debug", format: "" },
    initialize: vi.fn(),
}));

// electron-log/main のモック
vi.mock("electron-log/main", () => ({
    default: {
        initialize: mocks.initialize,
        transports: {
            file: mocks.file,
            console: mocks.console,
        },
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
            await import("./logger");
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
            await import("./logger");
            expect(mocks.file.level).toBe("debug");
            expect(mocks.console.level).toBe("debug");
        });

        it("should set format to include processType", async () => {
            await import("./logger");
            expect(mocks.file.format).toContain("[{processType}]");
            expect(mocks.console.format).toContain("[{processType}]");
        });
    });

    describe("in production environment", () => {
        beforeEach(() => {
            process.env.NODE_ENV = "production";
            // app.isPackaged を true に変更したいが、vi.mockはhoistされるため
            // ここで動的に変更する必要がある。
            // electronモックの定義を単純なオブジェクト参照ではなく、書き換え可能なプロパティにする必要があるが、
            // 今回は簡易的に app.isPackagedプロパティを書き換える
            // (vi.mockで返しているオブジェクトの実体は変更可能)
            (app.isPackaged as any) = true;
        });

        it("should set info level for file", async () => {
            await import("./logger");
            expect(mocks.file.level).toBe("info");
            expect(mocks.console.level).toBe("debug"); // console is always debug in config
        });
    });
});
