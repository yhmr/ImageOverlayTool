import { app } from "electron";

import type { E2ERuntimeConfig } from "../e2e/runtimeConfig";
import log from "../logger";

export const initializeRuntimeEnvironment = (
    e2eConfig: E2ERuntimeConfig
): void => {
    if (e2eConfig.enabled) {
        process.env.IOT_E2E_MODE = "1";
        process.env.IOT_E2E_ARTIFACTS_DIR = e2eConfig.artifactsDir;
        process.env.IOT_E2E_FIXED_NOW = String(e2eConfig.fixedNow);
        process.env.IOT_E2E_RANDOM_SEED = String(e2eConfig.randomSeed);
        log.info("E2E test mode enabled", {
            artifactsDir: e2eConfig.artifactsDir,
            fixedNow: e2eConfig.fixedNow,
            randomSeed: e2eConfig.randomSeed,
        });
    }

    // 開発中のみ、外部からのデバッグ接続(9222)を許可する
    if (!app.isPackaged && !e2eConfig.enabled) {
        app.commandLine.appendSwitch("remote-debugging-port", "9222");
    }
};
