import { expect, test } from "@playwright/test";

import {
    applyFixtureScene,
    launchE2EApp,
    openImageSettingsWindow,
    resolveFixtureScenePath,
} from "./helpers/electronHarness";

test("startup smoke loads scene from positional startup path", async () => {
    const startupScenePath = resolveFixtureScenePath("default.scene.json");
    const { app, page } = await launchE2EApp({
        appArgs: [startupScenePath],
    });

    try {
        const settingsPage = await openImageSettingsWindow(app, page);
        await expect(
            settingsPage.getByTestId("settings.image-item.card")
        ).toHaveCount(1);
    } finally {
        await app.close();
    }
});

test("control smoke applies scene via second-instance command", async () => {
    const { app, page } = await launchE2EApp();

    try {
        await applyFixtureScene(page, "default.scene.json");
        const settingsPage = await openImageSettingsWindow(app, page);
        await expect(
            settingsPage.getByTestId("settings.image-item.card")
        ).toHaveCount(1);
    } finally {
        await app.close();
    }
});
