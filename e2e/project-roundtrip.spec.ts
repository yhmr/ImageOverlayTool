import { test, expect } from "@playwright/test";
import {
    applyFixtureScene,
    launchE2EApp,
    openImageSettingsWindow,
    resolveFixtureScenePath,
    runControlCommand,
} from "./helpers/electronHarness";

test("control switch-scene updates loaded image set", async () => {
    const startupScenePath = resolveFixtureScenePath("default.scene.json");
    const { app, page } = await launchE2EApp({
        appArgs: [startupScenePath],
    });

    try {
        const settingsPage = await openImageSettingsWindow(app, page);
        const cards = settingsPage.getByTestId("settings.image-item.card");

        await expect(cards).toHaveCount(1);

        const scene02Path = resolveFixtureScenePath("scene02-image-settings.scene.json");
        await runControlCommand(["--switch-scene", scene02Path]);
        await expect(cards).toHaveCount(4);

        await applyFixtureScene(page, "default.scene.json");
        await expect(cards).toHaveCount(1);
    } finally {
        await app.close();
    }
});
