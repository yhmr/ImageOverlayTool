import { test, expect } from "@playwright/test";

import {
    applyFixtureScene,
    captureViaE2E,
    E2E_CAPTURE_PATH,
    getE2EState,
    launchE2EApp,
    readPngArtifactMetadata,
    waitForE2EStable,
} from "./helpers/electronHarness";

test("e2e control bridge applies fixture scene deterministically", async () => {
    const { app, page } = await launchE2EApp();

    try {
        await applyFixtureScene(page, "default.scene.json");

        const state = await getE2EState(page);
        expect(state.imageCount).toBeGreaterThan(0);

        const stable = await waitForE2EStable(page, { timeoutMs: 5000 });
        expect(stable.stable).toBe(true);

        const captureResult = await captureViaE2E(page, { mode: "window" });
        expect(captureResult).not.toBeNull();
        await expect.poll(() => readPngArtifactMetadata(E2E_CAPTURE_PATH)).toMatchObject({
            exists: true,
            isValidPng: true,
        });
    } finally {
        await app.close();
    }
});
