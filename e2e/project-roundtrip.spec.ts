import fs from "fs";
import { test, expect } from "@playwright/test";
import {
    applyFixtureScene,
    clickAppMenuItem,
    E2E_PROJECT_PATH,
    getE2EState,
    launchE2EApp,
} from "./helpers/electronHarness";

const readProjectSnapshot = (): {
    exists: boolean;
    imageCount: number;
    dimensionLineCount: number;
    unit: string | null;
    unitFactor: number | null;
    windowColor: string | null;
    hasCanvas: boolean;
} => {
    try {
        const project = JSON.parse(fs.readFileSync(E2E_PROJECT_PATH, "utf-8")) as {
            images?: unknown[];
            dimensionLines?: unknown[];
            settings?: {
                unit?: string;
                unitFactor?: number;
            };
            window?: {
                color?: string;
            };
            canvas?: unknown;
        };
        return {
            exists: true,
            imageCount: project.images?.length ?? 0,
            dimensionLineCount: project.dimensionLines?.length ?? 0,
            unit: project.settings?.unit ?? null,
            unitFactor:
                typeof project.settings?.unitFactor === "number"
                    ? project.settings.unitFactor
                    : null,
            windowColor: project.window?.color ?? null,
            hasCanvas: project.canvas != null,
        };
    } catch {
        return {
            exists: false,
            imageCount: -1,
            dimensionLineCount: -1,
            unit: null,
            unitFactor: null,
            windowColor: null,
            hasCanvas: false,
        };
    }
};

test("save as -> new project -> open project roundtrip", async () => {
    const { app, page } = await launchE2EApp();

    try {
        const undoButton = page.getByTestId("main.action.undo");
        await expect(undoButton).toBeDisabled();
        await applyFixtureScene(page, "default.scene.json");
        const stateBeforeSave = await getE2EState(page);
        expect(stateBeforeSave.imageCount).toBeGreaterThan(0);

        await clickAppMenuItem(page, "main.menu.item.save-project-as");

        await expect.poll(() => readProjectSnapshot()).toMatchObject({
            exists: true,
            imageCount: stateBeforeSave.imageCount,
            dimensionLineCount: stateBeforeSave.dimensionLineCount,
            unit: stateBeforeSave.unit,
            unitFactor: stateBeforeSave.unitFactor,
            windowColor: stateBeforeSave.windowColor,
            hasCanvas: true,
        });

        await clickAppMenuItem(page, "main.menu.item.new-project");
        await expect(undoButton).toBeDisabled();

        await clickAppMenuItem(page, "main.menu.item.open-project");
        await clickAppMenuItem(page, "main.menu.item.save-project");

        await expect.poll(async () => getE2EState(page)).toMatchObject({
            imageCount: stateBeforeSave.imageCount,
            dimensionLineCount: stateBeforeSave.dimensionLineCount,
            unit: stateBeforeSave.unit,
            unitFactor: stateBeforeSave.unitFactor,
            windowColor: stateBeforeSave.windowColor,
            isUIHidden: stateBeforeSave.isUIHidden,
        });
        await expect.poll(() => readProjectSnapshot()).toMatchObject({
            exists: true,
            imageCount: stateBeforeSave.imageCount,
            dimensionLineCount: stateBeforeSave.dimensionLineCount,
            unit: stateBeforeSave.unit,
            unitFactor: stateBeforeSave.unitFactor,
            windowColor: stateBeforeSave.windowColor,
            hasCanvas: true,
        });
    } finally {
        await app.close();
    }
});
