import fs from "fs";
import { test, expect } from "@playwright/test";
import {
    clickAppMenuItem,
    E2E_CAPTURE_PATH,
    E2E_PROJECT_PATH,
    launchE2EApp,
} from "./helpers/electronHarness";

const readProjectImageCount = (): number => {
    try {
        const project = JSON.parse(fs.readFileSync(E2E_PROJECT_PATH, "utf-8")) as {
            images?: unknown[];
        };
        return project.images?.length ?? 0;
    } catch {
        return -1;
    }
};

test("save as -> new project -> open project roundtrip", async () => {
    const { app, page } = await launchE2EApp();

    try {
        const undoButton = page.getByTestId("main.action.undo");
        const redoButton = page.getByTestId("main.action.redo");

        await expect(undoButton).toBeDisabled();
        await expect(redoButton).toBeDisabled();

        // FABメニューを展開してからキャプチャ
        await page.getByTestId("main.fab.menu-toggle").click();
        await page.getByTestId("main.fab.capture").click();

        await expect.poll(() => fs.existsSync(E2E_CAPTURE_PATH)).toBe(true);
        await expect(undoButton).toBeEnabled();

        await clickAppMenuItem(page, "main.menu.item.save-project-as");

        await expect.poll(() => fs.existsSync(E2E_PROJECT_PATH)).toBe(true);
        await expect.poll(() => readProjectImageCount()).toBeGreaterThan(0);

        await clickAppMenuItem(page, "main.menu.item.new-project");
        await expect(undoButton).toBeDisabled();

        await clickAppMenuItem(page, "main.menu.item.open-project");
        await clickAppMenuItem(page, "main.menu.item.save-project");

        await expect.poll(() => readProjectImageCount()).toBeGreaterThan(0);
    } finally {
        await app.close();
    }
});
