import fs from "fs";
import { test, expect } from "@playwright/test";
import {
    applyFixtureScene,
    clickAppMenuItem,
    E2E_CAPTURE_PATH,
    launchE2EApp,
} from "./helpers/electronHarness";

test("image settings window supports stable UI controls", async () => {
    const { app, page } = await launchE2EApp();

    try {
        await applyFixtureScene(page, "default.scene.json");

        const settingsWindowPromise = app.waitForEvent("window");
        await clickAppMenuItem(page, "main.menu.item.open-image-settings");
        const settingsPage = await settingsWindowPromise;

        await settingsPage.getByTestId("settings.app.root").waitFor({
            state: "visible",
        });
        await expect.poll(() => app.windows().length).toBe(2);

        const cards = settingsPage.getByTestId("settings.image-item.card");
        const beforeCount = await cards.count();

        await settingsPage.getByTestId("settings.image-list.add").click();
        await expect(cards).toHaveCount(beforeCount + 1);

        await settingsPage.getByTestId("settings.menu.capture").click();
        await expect.poll(() => fs.existsSync(E2E_CAPTURE_PATH)).toBe(true);

        await settingsPage.getByTestId("settings.menu.close").click();
        await clickAppMenuItem(page, "main.menu.item.open-image-settings");
        await settingsPage.getByTestId("settings.menu.bar").waitFor({
            state: "visible",
        });
    } finally {
        await app.close();
    }
});
