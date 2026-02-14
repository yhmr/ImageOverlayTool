import fs from "fs";
import path from "path";
import { _electron as electron, ElectronApplication, Page } from "playwright";
import type { E2ESceneInput } from "../../src/shared/types/E2EControl";

const APP_ROOT = path.resolve(__dirname, "..", "..");
const OUT_MAIN_PATH = path.join(APP_ROOT, "out", "main", "index.js");

export const E2E_ARTIFACTS_DIR = path.join(
    APP_ROOT,
    "test-results",
    "e2e-artifacts"
);
export const E2E_FIXTURES_DIR = path.join(APP_ROOT, "e2e", "fixtures");
export const E2E_SCENES_DIR = path.join(E2E_FIXTURES_DIR, "scenes");
export const E2E_PROJECT_PATH = path.join(E2E_ARTIFACTS_DIR, "project.e2e.iot");
export const E2E_CAPTURE_PATH = path.join(E2E_ARTIFACTS_DIR, "capture.e2e.png");
export const E2E_EXPORT_PATH = path.join(E2E_ARTIFACTS_DIR, "export.e2e.png");

const E2E_RESET_FILES = [E2E_PROJECT_PATH, E2E_CAPTURE_PATH, E2E_EXPORT_PATH];

const assertBuildOutput = (): void => {
    if (!fs.existsSync(OUT_MAIN_PATH)) {
        throw new Error(
            `Missing build output: ${OUT_MAIN_PATH}. Run \"npm run build\" before e2e.`
        );
    }
};

const resetArtifacts = (): void => {
    fs.mkdirSync(E2E_ARTIFACTS_DIR, { recursive: true });
    for (const filePath of E2E_RESET_FILES) {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }
};

export const launchE2EApp = async (): Promise<{
    app: ElectronApplication;
    page: Page;
}> => {
    assertBuildOutput();
    resetArtifacts();

    const electronPath = require("electron") as string;
    const env = {
        ...process.env,
        NODE_ENV: "test",
        IOT_E2E_ARTIFACTS_DIR: E2E_ARTIFACTS_DIR,
        IOT_E2E_FIXED_NOW: "1700000000000",
        IOT_E2E_RANDOM_SEED: "424242",
    };
    delete env.ELECTRON_RUN_AS_NODE;

    const app = await electron.launch({
        executablePath: electronPath,
        args: [
            APP_ROOT,
            "--no-sandbox",
            "--disable-gpu",
            "--disable-dev-shm-usage",
            "--disable-software-rasterizer",
            "--e2e",
        ],
        env,
    });

    const page = await app.firstWindow();
    await page.getByTestId("main.app.root").waitFor({ state: "attached" });
    await page.waitForFunction(() => Boolean(window.__IOT_E2E__));

    return { app, page };
};

export const applyScene = async (
    page: Page,
    scene: E2ESceneInput
): Promise<void> => {
    await page.evaluate(async (sceneInput) => {
        const bridge = (window as { __IOT_E2E__?: unknown }).__IOT_E2E__ as
            | { setScene: (scene: E2ESceneInput) => Promise<{ stable: boolean }> }
            | undefined;
        if (!bridge) {
            throw new Error("E2E bridge is not available in renderer.");
        }

        const result = await bridge.setScene(sceneInput);
        if (!result.stable) {
            throw new Error("Renderer did not reach stable state after setScene.");
        }
    }, scene);
};

export const applyFixtureScene = async (
    page: Page,
    sceneFileName = "default.scene.json"
): Promise<void> => {
    const scenePath = path.join(E2E_SCENES_DIR, sceneFileName);
    const scene = JSON.parse(fs.readFileSync(scenePath, "utf-8")) as E2ESceneInput;
    await applyScene(page, scene);
};

const ensureMenuOpened = async (page: Page): Promise<void> => {
    const trigger = page.getByTestId("main.menu.trigger");
    const menuContent = page.getByTestId("main.menu.content");

    for (let i = 0; i < 5; i++) {
        await trigger.click({ force: true });
        await page.waitForTimeout(100);
        if (await menuContent.isVisible()) {
            return;
        }
    }

    throw new Error("Failed to open application menu in E2E test.");
};

export const clickAppMenuItem = async (
    page: Page,
    itemTestId:
        | "main.menu.item.new-project"
        | "main.menu.item.open-project"
        | "main.menu.item.save-project"
        | "main.menu.item.save-project-as"
        | "main.menu.item.open-image-settings"
        | "main.menu.item.settings"
        | "main.menu.item.about"
): Promise<void> => {
    await ensureMenuOpened(page);
    await page.getByTestId(itemTestId).waitFor({ state: "attached" });

    await page.evaluate((testId) => {
        const target = document.querySelector(
            `[data-testid="${testId}"]`
        ) as HTMLElement | null;
        target?.click();
    }, itemTestId);
};
