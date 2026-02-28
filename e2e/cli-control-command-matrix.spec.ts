import path from "path";
import { expect, test } from "@playwright/test";

import {
    launchE2EApp,
    runControlCommandWithResult,
} from "./helpers/electronHarness";

test("control --add-image returns structured success for existing file", async () => {
    const { app, page } = await launchE2EApp();

    try {
        const fixtureImagePath = path.join(
            process.cwd(),
            "e2e",
            "fixtures",
            "images",
            "scene02-01.png"
        );
        const result = await runControlCommandWithResult([
            "--add-image",
            fixtureImagePath,
        ]);

        expect(result.status).toBe(0);
        expect(result.stdout).toContain('"code": "CLI_CONTROL_OK"');
        expect(result.stderr).toBe("");
        await expect(page.getByTestId("main.app.root")).toBeVisible();
    } finally {
        await app.close();
    }
});

test("control --add-image rejects missing file", async () => {
    const { app, page } = await launchE2EApp();

    try {
        const missingImagePath = path.join(
            process.cwd(),
            "e2e",
            "fixtures",
            "images",
            "missing.png"
        );
        const result = await runControlCommandWithResult([
            "--add-image",
            missingImagePath,
        ]);

        expect(result.status).toBe(2);
        expect(result.stdout).toBe("");
        expect(result.stderr).toContain("--add-image file not found");
        await expect(page.getByTestId("main.app.root")).toBeVisible();
    } finally {
        await app.close();
    }
});

test("control --wait-stable returns structured success", async () => {
    const { app } = await launchE2EApp();

    try {
        const result = await runControlCommandWithResult([
            "--wait-stable",
            "--timeout-ms",
            "7000",
        ]);

        expect(result.status).toBe(0);
        expect(result.stdout).toContain('"code": "CLI_CONTROL_OK"');
        expect(result.stderr).toBe("");
    } finally {
        await app.close();
    }
});

test("control --capture-window rejects unsupported extension", async () => {
    const { app, page } = await launchE2EApp();

    try {
        const result = await runControlCommandWithResult([
            "--capture-window",
            "capture.webp",
        ]);

        expect(result.status).toBe(2);
        expect(result.stdout).toBe("");
        expect(result.stderr).toContain(
            "--capture-window supports only .png / .jpg / .jpeg."
        );
        await expect(page.getByTestId("main.app.root")).toBeVisible();
    } finally {
        await app.close();
    }
});

test("control --save-stage rejects unsupported extension", async () => {
    const { app, page } = await launchE2EApp();

    try {
        const result = await runControlCommandWithResult([
            "--save-stage",
            "stage.webp",
        ]);

        expect(result.status).toBe(2);
        expect(result.stdout).toBe("");
        expect(result.stderr).toContain(
            "--save-stage supports only .png / .jpg / .jpeg."
        );
        await expect(page.getByTestId("main.app.root")).toBeVisible();
    } finally {
        await app.close();
    }
});
