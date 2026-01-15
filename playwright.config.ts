import { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
    testDir: './e2e',
    timeout: 90000, // CI環境向けに延長
    retries: 0,
    use: {
        trace: 'on-first-retry',
    },
};
export default config;
