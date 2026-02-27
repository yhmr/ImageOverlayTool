import path from "path";
import { expect, test } from "@playwright/test";

import {
    applyFixtureScene,
    E2E_SCENES_DIR,
    getE2EState,
    launchE2EApp,
    waitForE2EStable,
} from "./helpers/electronHarness";

test("startup smoke loads scene from positional startup path", async () => {
    const startupScenePath = path.join(E2E_SCENES_DIR, "default.scene.json");
    const { app, page } = await launchE2EApp({
        appArgs: [startupScenePath],
    });

    try {
        const stable = await waitForE2EStable(page, { timeoutMs: 5000 });
        expect(stable.stable).toBe(true);

        const state = await getE2EState(page);
        expect(state.imageCount).toBeGreaterThan(0);
    } finally {
        await app.close();
    }
});

test("control smoke applies scene via e2e control bridge", async () => {
    const { app, page } = await launchE2EApp();

    try {
        await applyFixtureScene(page, "default.scene.json");
        const state = await getE2EState(page);
        expect(state.imageCount).toBeGreaterThan(0);

        const stable = await waitForE2EStable(page, { timeoutMs: 5000 });
        expect(stable.stable).toBe(true);
    } finally {
        await app.close();
    }
});
