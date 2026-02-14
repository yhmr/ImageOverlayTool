import fs from "fs";
import { test, expect } from "@playwright/test";

import {
    applyFixtureScene,
    E2E_CAPTURE_PATH,
    launchE2EApp,
} from "./helpers/electronHarness";

test("e2e control bridge applies fixture scene deterministically", async () => {
    const { app, page } = await launchE2EApp();

    try {
        await applyFixtureScene(page, "default.scene.json");

        const state = await page.evaluate(() => {
            const bridge = (window as { __IOT_E2E__?: unknown }).__IOT_E2E__ as
                | { getState: () => unknown }
                | undefined;
            if (!bridge) {
                throw new Error("E2E bridge is unavailable.");
            }
            return bridge.getState();
        });

        expect(state.imageCount).toBeGreaterThan(0);

        const stable = await page.evaluate(async () => {
            const bridge = (window as { __IOT_E2E__?: unknown }).__IOT_E2E__ as
                | { waitStable: (request?: { timeoutMs?: number }) => Promise<{
                      stable: boolean;
                  }> }
                | undefined;
            if (!bridge) {
                throw new Error("E2E bridge is unavailable.");
            }
            return bridge.waitStable({ timeoutMs: 5000 });
        });
        expect(stable.stable).toBe(true);

        const captureResult = await page.evaluate(async () => {
            const bridge = (window as { __IOT_E2E__?: unknown }).__IOT_E2E__ as
                | { capture: (request?: { mode?: "window" | "screen" }) => Promise<unknown> }
                | undefined;
            if (!bridge) {
                throw new Error("E2E bridge is unavailable.");
            }
            return bridge.capture({ mode: "window" });
        });
        expect(captureResult).not.toBeNull();
        await expect.poll(() => fs.existsSync(E2E_CAPTURE_PATH)).toBe(true);
    } finally {
        await app.close();
    }
});
