import { test, expect } from "@playwright/test";
import {
    applyFixtureScene,
    launchE2EApp,
    openImageSettingsWindow,
} from "./helpers/electronHarness";

test("undo/redo keyboard updates history direction", async () => {
    const { app, page } = await launchE2EApp();

    try {
        const undoButton = page.getByTestId("main.action.undo");
        const redoButton = page.getByTestId("main.action.redo");
        const modifier = process.platform === "darwin" ? "Meta" : "Control";

        await applyFixtureScene(page, "default.scene.json");

        const settingsPage = await openImageSettingsWindow(app, page);
        const cards = settingsPage.getByTestId("settings.image-item.card");
        const beforeCount = await cards.count();
        await settingsPage.getByTestId("settings.image-list.add").click();
        await expect(cards).toHaveCount(beforeCount + 1);
        await settingsPage.getByTestId("settings.menu.close").click();

        await page.bringToFront();
        await page.getByTestId("main.canvas.area").click({ position: { x: 20, y: 20 } });

        await expect(undoButton).toBeEnabled();
        await expect(redoButton).toBeDisabled();

        await page.keyboard.press(`${modifier}+Z`);
        await expect(redoButton).toBeEnabled();

        await page.keyboard.press(`${modifier}+Shift+Z`);
        await expect(undoButton).toBeEnabled();
    } finally {
        await app.close();
    }
});
