import fs from "fs";
import { test, expect } from "@playwright/test";
import {
    applyFixtureScene,
    E2E_CAPTURE_PATH,
    launchE2EApp,
} from "./helpers/electronHarness";

test("undo/redo keyboard updates history direction", async () => {
    const { app, page } = await launchE2EApp();

    try {
        const undoButton = page.getByTestId("main.action.undo");
        const redoButton = page.getByTestId("main.action.redo");
        const modifier = process.platform === "darwin" ? "Meta" : "Control";

        await applyFixtureScene(page, "default.scene.json");

        // FABメニューを展開してからキャプチャ
        await page.getByTestId("main.fab.menu-toggle").click();
        await page.getByTestId("main.fab.capture").click();
        await expect.poll(() => fs.existsSync(E2E_CAPTURE_PATH)).toBe(true);
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
