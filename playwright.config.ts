import { PlaywrightTestConfig } from "@playwright/test";

const config: PlaywrightTestConfig = {
    testDir: "./e2e",
    timeout: 90000,
    retries: process.env.CI ? 2 : 0,
    workers: 1,
    use: {
        trace: "retain-on-failure",
        screenshot: "only-on-failure",
        video: "retain-on-failure",
    },
};

export default config;
