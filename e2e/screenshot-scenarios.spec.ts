import fs from "fs";
import path from "path";
import { expect, test, type Page } from "@playwright/test";

import {
    applyFixtureScene,
    E2E_SCREENSHOT_DIR,
    launchE2EApp,
    openImageSettingsWindow,
    waitForE2EStable,
} from "./helpers/electronHarness";

const ensureScreenshotDir = (): void => {
    fs.rmSync(E2E_SCREENSHOT_DIR, { recursive: true, force: true });
    fs.mkdirSync(E2E_SCREENSHOT_DIR, { recursive: true });
};

const screenshotPath = (fileName: string): string =>
    path.join(E2E_SCREENSHOT_DIR, fileName);

const saveScreenshot = async (page: Page, fileName: string): Promise<void> => {
    await page.screenshot({
        path: screenshotPath(fileName),
        animations: "disabled",
    });
};

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

test.describe("screenshot scenarios", () => {
    test.beforeAll(() => {
        ensureScreenshotDir();
    });

    test("scene01 home menu screenshot", async () => {
        const { app, page } = await launchE2EApp();
        try {
            await applyFixtureScene(page, "scene01-home.scene.json");
            await page.getByTestId("main.menu.trigger").click();
            await expect(page.getByTestId("main.menu.content")).toBeVisible();
            await saveScreenshot(page, "scene01-home-menu.png");
        } finally {
            await app.close();
        }
    });

    test("scene02 image settings screenshot", async () => {
        const { app, page } = await launchE2EApp();
        try {
            await applyFixtureScene(page, "scene02-image-settings.scene.json", {
                requireStable: false,
            });
            const settingsPage = await openImageSettingsWindow(app, page);
            const transparencySlider = settingsPage
                .getByTestId("settings.image-item.transparency.slider")
                .first();
            await expect(transparencySlider).toBeVisible();
            await transparencySlider.click({ force: true });
            await settingsPage.keyboard.press("ArrowRight");
            await saveScreenshot(settingsPage, "scene02-image-settings.png");
        } finally {
            await app.close();
        }
    });

    test("scene03 perspective screenshot", async () => {
        const { app, page } = await launchE2EApp();
        try {
            await applyFixtureScene(page, "scene03-perspective.scene.json");
            await waitForE2EStable(page, { timeoutMs: 5000 });
            await page.getByTestId("main.canvas.area").click({
                position: { x: 120, y: 120 },
            });
            await saveScreenshot(page, "scene03-perspective.png");
        } finally {
            await app.close();
        }
    });

    test("scene04 filters screenshot", async () => {
        const { app, page } = await launchE2EApp();
        try {
            await applyFixtureScene(page, "scene04-filters.scene.json");
            const settingsPage = await openImageSettingsWindow(app, page);
            const filterTrigger = settingsPage
                .getByTestId("settings.filters.trigger")
                .first();
            await expect(filterTrigger).toBeVisible();
            await filterTrigger.click({ force: true });
            await expect(
                settingsPage
                    .getByTestId("settings.filters.binarization.switch")
                    .first()
            ).toBeVisible();
            await saveScreenshot(settingsPage, "scene04-filters.png");
        } finally {
            await app.close();
        }
    });

    test("scene05 controls screenshot", async () => {
        const { app, page } = await launchE2EApp();
        try {
            await applyFixtureScene(page, "scene05-controls.scene.json");
            await ensureFabMenuOpened(page);
            const captureButton = page.getByTestId("main.fab.capture");
            await captureButton.hover({ force: true });
            await page.waitForTimeout(120);
            await saveScreenshot(page, "scene05-controls.png");
        } finally {
            await app.close();
        }
    });

    test("scene06 final screenshot", async () => {
        const { app, page } = await launchE2EApp();
        try {
            await applyFixtureScene(page, "scene06-final.scene.json");
            await waitForE2EStable(page, { timeoutMs: 5000 });
            await saveScreenshot(page, "scene06-final.png");
        } finally {
            await app.close();
        }
    });
});
