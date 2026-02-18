import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "electron";

import { initializeRuntimeEnvironment } from "@/main/bootstrap/runtime";
import type { E2ERuntimeConfig } from "@/main/e2e/runtimeConfig";

vi.mock("electron", () => ({
    app: {
        isPackaged: false,
        commandLine: {
            appendSwitch: vi.fn(),
        },
    },
}));

vi.mock("@/main/logger", () => ({
    default: {
        info: vi.fn(),
    },
}));

const ORIGINAL_ENV = { ...process.env };

const createConfig = (overrides: Partial<E2ERuntimeConfig> = {}): E2ERuntimeConfig => ({
    enabled: false,
    artifactsDir: "test-results/e2e-artifacts",
    fixturesDir: "e2e/fixtures",
    projectFilePath: "test-results/e2e-artifacts/project.e2e.iot",
    captureFilePath: "test-results/e2e-artifacts/capture.e2e.png",
    exportImagePath: "test-results/e2e-artifacts/export.e2e.png",
    fixedNow: 1700000000000,
    randomSeed: 424242,
    ...overrides,
});

describe("initializeRuntimeEnvironment", () => {
    beforeEach(() => {
        process.env = { ...ORIGINAL_ENV };
        vi.mocked(app.commandLine.appendSwitch).mockClear();
    });

    afterEach(() => {
        process.env = { ...ORIGINAL_ENV };
    });

    it("enables e2e environment variables only in e2e mode", () => {
        initializeRuntimeEnvironment(createConfig({ enabled: true }));

        expect(process.env.IOT_E2E_MODE).toBe("1");
        expect(process.env.IOT_E2E_ARTIFACTS_DIR).toBe("test-results/e2e-artifacts");
        expect(process.env.IOT_E2E_FIXTURES_DIR).toBe("e2e/fixtures");
        expect(process.env.IOT_E2E_FIXED_NOW).toBe("1700000000000");
        expect(process.env.IOT_E2E_RANDOM_SEED).toBe("424242");
        expect(app.commandLine.appendSwitch).not.toHaveBeenCalled();
    });

    it("enables remote debugging only in non-e2e development mode", () => {
        initializeRuntimeEnvironment(createConfig({ enabled: false }));

        expect(app.commandLine.appendSwitch).toHaveBeenCalledWith(
            "remote-debugging-port",
            "9222"
        );
    });
});
