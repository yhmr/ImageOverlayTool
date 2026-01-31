import { _electron as electron, test, expect } from '@playwright/test';
import path from 'path';

test('app launch', async () => {
    // Resolve electron executable path
    const electronPath = require('electron');
    const appPath = path.resolve(__dirname, '..');

    const app = await electron.launch({
        executablePath: electronPath,
        args: [
            appPath,
            '--no-sandbox',
            '--disable-gpu',
            '--disable-dev-shm-usage',
            '--disable-software-rasterizer' // CI環境によってはこれが有効な場合もあるが、まずはGPU無効化を優先
        ],

    });

    const window = await app.firstWindow();

    // Capture console logs
    window.on('console', msg => console.log(`[Renderer Console] ${msg.text()}`));
    window.on('pageerror', exc => console.log(`[Renderer Error] ${exc}`));

    await window.waitForLoadState('domcontentloaded');

    // Check if the window is visible/loaded
    // Increase timeout for CI environments
    const container = await window.waitForSelector('.main-app-container', { timeout: 60000 });
    expect(container).toBeTruthy();

    await app.close();
});
