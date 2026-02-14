"use strict";

const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const APP_ROOT = path.resolve(__dirname, "..");
const BUILD_MAIN_ENTRY = path.join(APP_ROOT, "out", "main", "index.js");

const run = (command, args, extraEnv = {}) => {
    const result = spawnSync(command, args, {
        stdio: "inherit",
        shell: process.platform === "win32",
        env: {
            ...process.env,
            ...extraEnv,
        },
    });

    if (typeof result.status === "number") {
        return result.status;
    }
    return 1;
};

const isCi = Boolean(process.env.CI);
const forceInCi = process.env.IOT_E2E_SCREENSHOT_FORCE_IN_CI === "1";

if (isCi && !forceInCi) {
    console.log(
        "[e2e:screenshots] Skip on CI by default. Set IOT_E2E_SCREENSHOT_FORCE_IN_CI=1 to run."
    );
    process.exit(0);
}

if (!fs.existsSync(BUILD_MAIN_ENTRY)) {
    console.log("[e2e:screenshots] Build output not found. Running `npm run build`.");
    const buildStatus = run("npm", ["run", "build"]);
    if (buildStatus !== 0) {
        process.exit(buildStatus);
    }
}

const testStatus = run("playwright", ["test", "e2e/screenshot-scenarios.spec.ts"], {
    IOT_E2E_SCREENSHOT_SCENARIOS: "1",
});
process.exit(testStatus);
