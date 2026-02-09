import { test, expect } from "@playwright/test";
import { launchE2EApp } from "./helpers/electronHarness";

test("app launch smoke", async () => {
    const { app, page } = await launchE2EApp();

    try {
        await expect(page.getByTestId("main.app.root")).toHaveCount(1);
        await expect(page.getByTestId("main.menu.bar")).toHaveCount(1);
    } finally {
        await app.close();
    }
});
