import { test, expect } from "@playwright/test";
import { launchE2EApp } from "./helpers/electronHarness";

test("undo/redo keyboard updates history direction", async () => {
    const { app, page } = await launchE2EApp();

    try {
        const undoButton = page.getByTestId("main.action.undo");
        const redoButton = page.getByTestId("main.action.redo");
        const modifier = process.platform === "darwin" ? "Meta" : "Control";

        await page.getByTestId("main.fab.capture").click();
        await expect(undoButton).toBeEnabled();
        await expect(redoButton).toBeDisabled();

        await page.getByTestId("main.canvas.area").click({ position: { x: 20, y: 20 } });

        await page.keyboard.press(`${modifier}+Z`);
        await expect(redoButton).toBeEnabled();

        await page.keyboard.press(`${modifier}+Shift+Z`);
        await expect(undoButton).toBeEnabled();
    } finally {
        await app.close();
    }
});
