import { test, expect } from "@playwright/test";

import {
    applyFixtureScene,
    E2E_CAPTURE_PATH,
    launchE2EApp,
    readPngArtifactMetadata,
    runControlCommand,
} from "./helpers/electronHarness";

test("second-instance capture-window command writes capture artifact", async () => {
    const { app, page } = await launchE2EApp();

    try {
        await applyFixtureScene(page, "default.scene.json");
        await runControlCommand(["--capture-window", E2E_CAPTURE_PATH]);

        await expect
            .poll(() => readPngArtifactMetadata(E2E_CAPTURE_PATH))
            .toMatchObject({
                exists: true,
                isValidPng: true,
            });
    } finally {
        await app.close();
    }
});
