import { expect, test } from "@playwright/test";

import {
    launchE2EApp,
    runControlCommandWithResult,
} from "./helpers/electronHarness";

test("control command reports invalid option in non-interactive mode", async () => {
    const { app, page } = await launchE2EApp();

    try {
        const result = await runControlCommandWithResult([
            "--set-opacity",
            "30",
            "--invalid-option",
        ]);

        expect(result.status).toBe(2);
        expect(result.stderr).toContain(
            "Unknown second-instance option: --invalid-option"
        );
        await expect(page.getByTestId("main.app.root")).toBeVisible();
    } finally {
        await app.close();
    }
});

test("control command returns structured success result", async () => {
    const { app } = await launchE2EApp();

    try {
        const result = await runControlCommandWithResult([
            "--set-opacity",
            "30",
        ]);

        expect(result.status).toBe(0);
        expect(result.stdout).toContain('"code": "CLI_CONTROL_OK"');
        expect(result.stderr).toBe("");
    } finally {
        await app.close();
    }
});
