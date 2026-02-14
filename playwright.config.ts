import { PlaywrightTestConfig } from "@playwright/test";

const RUN_SCREENSHOT_SCENARIOS =
    process.env.IOT_E2E_SCREENSHOT_SCENARIOS === "1";

const config: PlaywrightTestConfig = {
    testDir: "./e2e",
    timeout: 90000,
    retries: process.env.CI ? 2 : 0,
    workers: 1,
    testIgnore: RUN_SCREENSHOT_SCENARIOS
        ? []
        : ["**/screenshot-scenarios.spec.ts"],
    use: {
        trace: "retain-on-failure",
        screenshot: "only-on-failure",
        video: "retain-on-failure",
    },
};

export default config;
