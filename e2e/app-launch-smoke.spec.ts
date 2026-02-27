import { test, expect } from "@playwright/test";
import { getE2EStatus, launchE2EApp } from "./helpers/electronHarness";

test("app launch smoke", async () => {
    const { app, page } = await launchE2EApp();

    try {
        await expect(page.getByTestId("main.app.root")).toHaveCount(1);
        await expect(page.getByTestId("main.menu.bar")).toHaveCount(1);

        const status = await getE2EStatus(page);
        expect(status.enabled).toBe(true);
    } finally {
        await app.close();
    }
});
