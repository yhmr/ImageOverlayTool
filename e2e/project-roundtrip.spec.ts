import fs from "fs";
import { test, expect } from "@playwright/test";
import {
    applyFixtureScene,
    clickAppMenuItem,
    E2E_PROJECT_PATH,
    getE2EState,
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
        await expect(undoButton).toBeDisabled();
        await applyFixtureScene(page, "default.scene.json");
        await expect.poll(async () => (await getE2EState(page)).imageCount).toBeGreaterThan(0);

        await clickAppMenuItem(page, "main.menu.item.save-project-as");

        await expect.poll(() => fs.existsSync(E2E_PROJECT_PATH)).toBe(true);
        await expect.poll(() => readProjectImageCount()).toBeGreaterThan(0);

        await clickAppMenuItem(page, "main.menu.item.new-project");
        await expect(undoButton).toBeDisabled();

        await clickAppMenuItem(page, "main.menu.item.open-project");
        await clickAppMenuItem(page, "main.menu.item.save-project");

        await expect.poll(() => readProjectImageCount()).toBeGreaterThan(0);
        await expect.poll(async () => (await getE2EState(page)).imageCount).toBeGreaterThan(0);
    } finally {
        await app.close();
    }
});
