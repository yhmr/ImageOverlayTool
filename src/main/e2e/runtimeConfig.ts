import fs from "fs";
import path from "path";

const E2E_SWITCH = "--e2e";
const DEFAULT_FIXED_NOW = 1700000000000;
const DEFAULT_RANDOM_SEED = 424242;

const resolveArtifactsDir = (): string => {
    const fromEnv = process.env.IOT_E2E_ARTIFACTS_DIR;
    if (fromEnv && fromEnv.trim().length > 0) {
        return path.resolve(fromEnv);
    }
    return path.resolve(process.cwd(), "test-results", "e2e-artifacts");
};

const resolveFixturesDir = (): string => {
    const fromEnv = process.env.IOT_E2E_FIXTURES_DIR;
    if (fromEnv && fromEnv.trim().length > 0) {
        return path.resolve(fromEnv);
    }
    return path.resolve(process.cwd(), "e2e", "fixtures");
};

const parseIntFromEnv = (
    value: string | undefined,
    fallback: number
): number => {
    if (!value) return fallback;
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : fallback;
};

export interface E2ERuntimeConfig {
    enabled: boolean;
    artifactsDir: string;
    fixturesDir: string;
    projectFilePath: string;
    captureFilePath: string;
    exportImagePath: string;
    fixedNow: number;
    randomSeed: number;
}

export const resolveE2ERuntimeConfig = (): E2ERuntimeConfig => {
    const enabled = process.argv.includes(E2E_SWITCH);
    const artifactsDir = resolveArtifactsDir();
    const fixturesDir = resolveFixturesDir();
    const fixedNow = parseIntFromEnv(
        process.env.IOT_E2E_FIXED_NOW,
        DEFAULT_FIXED_NOW
    );
    const randomSeed = parseIntFromEnv(
        process.env.IOT_E2E_RANDOM_SEED,
        DEFAULT_RANDOM_SEED
    );

    if (enabled) {
        fs.mkdirSync(artifactsDir, { recursive: true });
    }

    return {
        enabled,
        artifactsDir,
        fixturesDir,
        projectFilePath: path.join(artifactsDir, "project.e2e.iot"),
        captureFilePath: path.join(artifactsDir, "capture.e2e.png"),
        exportImagePath: path.join(artifactsDir, "export.e2e.png"),
        fixedNow,
        randomSeed,
    };
};
