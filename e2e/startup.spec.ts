import { _electron as electron, test, expect } from '@playwright/test';
import path from 'path';

test('app launch', async () => {
    // Resolve electron executable path
    const electronPath = require('electron');
    const appPath = path.resolve(__dirname, '..');

    const app = await electron.launch({
        executablePath: electronPath,
        args: [appPath],
    });

    const window = await app.firstWindow();

    // Capture console logs
    window.on('console', msg => console.log(`[Renderer Console] ${msg.text()}`));
    window.on('pageerror', exc => console.log(`[Renderer Error] ${exc}`));

    await window.waitForLoadState('domcontentloaded');

    // Check if the window is visible/loaded
    // Increase timeout or wait for specific selector
    // Check if the window is visible/loaded
    // Increase timeout or wait for specific selector
    const container = await window.waitForSelector('.container', { timeout: 5000 });
    expect(container).toBeTruthy();

    await app.close();
});
