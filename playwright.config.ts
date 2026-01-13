import { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
    testDir: './e2e',
    timeout: 30000,
    retries: 0,
    use: {
        trace: 'on-first-retry',
    },
};
export default config;
