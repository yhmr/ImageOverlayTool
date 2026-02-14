import fs from "fs";
import { test, expect, Page } from "@playwright/test";
import {
    applyFixtureScene,
    clickAppMenuItem,
    E2E_CAPTURE_PATH,
    E2E_EXPORT_PATH,
    launchE2EApp,
} from "./helpers/electronHarness";

const isFabMenuOpen = async (page: Page): Promise<boolean> => {
    return page.getByTestId("main.fab.menu-toggle").evaluate((element) => {
        return element.className.includes("rotate-90");
    });
};

const ensureFabMenuOpened = async (page: Page): Promise<void> => {
    if (!(await isFabMenuOpen(page))) {
        await page.getByTestId("main.fab.menu-toggle").click({ force: true });
    }
    await expect.poll(() => isFabMenuOpen(page)).toBe(true);
};

test("settings and about dialogs are operable via menu", async () => {
    const { app, page } = await launchE2EApp();

    try {
        await clickAppMenuItem(page, "main.menu.item.settings");

        await expect(page.getByTestId("main.settings.language.trigger")).toBeVisible();
        await expect(page.getByTestId("main.settings.log-level.trigger")).toBeVisible();

        await page.getByTestId("main.settings.log-level.trigger").click();
        await expect(
            page.getByTestId("main.settings.log-level.option.debug")
        ).toBeVisible();
        await page.getByTestId("main.settings.log-level.option.debug").click();

        await page.getByTestId("main.settings.done").click();
        await expect(page.getByTestId("main.settings.done")).toHaveCount(0);

        await clickAppMenuItem(page, "main.menu.item.settings");
        await page.getByTestId("main.settings.log-level.trigger").click();
        await expect(
            page.getByTestId("main.settings.log-level.option.debug")
        ).toHaveAttribute("data-state", "checked");
        await page.keyboard.press("Escape");
        await page.getByTestId("main.settings.done").click();

        await clickAppMenuItem(page, "main.menu.item.about");
        await expect(page.getByTestId("main.about.link.github")).toBeVisible();
        await expect(page.getByTestId("main.about.done")).toBeVisible();
        await page.getByTestId("main.about.done").click();
        await expect(page.getByTestId("main.about.done")).toHaveCount(0);
    } finally {
        await app.close();
    }
});

test("export dialog saves direct export artifact", async () => {
    const { app, page } = await launchE2EApp();

    try {
        await applyFixtureScene(page, "default.scene.json");
        await ensureFabMenuOpened(page);
        await page.getByTestId("main.fab.export").click({ force: true });
        await expect(page.getByTestId("main.export.save")).toBeVisible();
        await page.getByTestId("main.export.save").click();
        await expect.poll(() => fs.existsSync(E2E_EXPORT_PATH)).toBe(true);
    } finally {
        await app.close();
    }
});

test("export dialog with include-background saves capture artifact", async () => {
    const { app, page } = await launchE2EApp();

    try {
        await applyFixtureScene(page, "default.scene.json");
        await ensureFabMenuOpened(page);
        await page.getByTestId("main.fab.export").click({ force: true });
        await expect(page.getByTestId("main.export.include-background")).toBeVisible();
        await page.getByTestId("main.export.include-background").click({
            force: true,
        });
        await page.getByTestId("main.export.save").click();
        await expect.poll(() => fs.existsSync(E2E_CAPTURE_PATH)).toBe(true);
    } finally {
        await app.close();
    }
});
