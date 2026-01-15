import { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
    testDir: './e2e',
    timeout: 90000, // CI環境向けに延長
    retries: process.env.CI ? 2 : 0, // CI環境では2回までリトライ
    use: {
        trace: 'on-first-retry',
    },
};
export default config;
