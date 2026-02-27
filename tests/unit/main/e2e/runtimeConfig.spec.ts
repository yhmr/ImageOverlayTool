import fs from "fs";
import path from "path";
import { beforeEach, afterEach, describe, expect, it } from "vitest";
import { resolveE2ERuntimeConfig } from "@/main/e2e/runtimeConfig";

const ORIGINAL_ENV = { ...process.env };

const resetProcessState = () => {
    process.env = { ...ORIGINAL_ENV };
};

describe("resolveE2ERuntimeConfig", () => {
    beforeEach(() => {
        resetProcessState();
    });

    afterEach(() => {
        resetProcessState();
    });

    it("returns disabled mode without --e2e", () => {
        const config = resolveE2ERuntimeConfig({
            isPackaged: false,
            appArgs: [],
        });

        expect(config.enabled).toBe(false);
    });

    it("resolves deterministic paths and values in e2e mode", () => {
        const artifactsDir = path.resolve("test-results", "e2e-runtime-config-test");
        const fixturesDir = path.resolve("e2e", "fixtures");
        process.env.IOT_INTERNAL_E2E = "1";
        process.env.IOT_E2E_ARTIFACTS_DIR = artifactsDir;
        process.env.IOT_E2E_FIXED_NOW = "1701234567890";
        process.env.IOT_E2E_RANDOM_SEED = "9001";

        const config = resolveE2ERuntimeConfig({
            isPackaged: false,
            appArgs: ["--e2e"],
        });

        expect(config.enabled).toBe(true);
        expect(config.artifactsDir).toBe(artifactsDir);
        expect(config.fixturesDir).toBe(fixturesDir);
        expect(config.projectFilePath).toBe(
            path.join(artifactsDir, "project.e2e.iot")
        );
        expect(config.captureFilePath).toBe(
            path.join(artifactsDir, "capture.e2e.png")
        );
        expect(config.exportImagePath).toBe(
            path.join(artifactsDir, "export.e2e.png")
        );
        expect(config.fixedNow).toBe(1701234567890);
        expect(config.randomSeed).toBe(9001);
        expect(fs.existsSync(artifactsDir)).toBe(true);
    });

    it("keeps e2e mode disabled when internal e2e env is missing", () => {
        const config = resolveE2ERuntimeConfig({
            isPackaged: false,
            appArgs: ["--e2e"],
        });

        expect(config.enabled).toBe(false);
    });

    it("keeps e2e mode disabled in packaged builds even with --e2e", () => {
        process.env.IOT_INTERNAL_E2E = "1";

        const config = resolveE2ERuntimeConfig({
            isPackaged: true,
            appArgs: ["--e2e"],
        });

        expect(config.enabled).toBe(false);
    });
});
