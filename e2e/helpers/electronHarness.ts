import fs from "fs";
import path from "path";
import { _electron as electron, ElectronApplication, Page } from "playwright";
import type { CaptureResult } from "../../src/shared/types/CaptureResult";
import type {
    E2ECaptureRequest,
    E2EControlStatus,
    E2EWaitStableRequest,
    E2EWaitStableResult,
} from "../../src/shared/types/E2EControl";

const APP_ROOT = path.resolve(__dirname, "..", "..");
const OUT_MAIN_PATH = path.join(APP_ROOT, "out", "main", "index.js");

export const E2E_ARTIFACTS_DIR = path.join(
    APP_ROOT,
    "test-results",
    "e2e-artifacts"
);
export const E2E_SCREENSHOT_DIR = path.join(
    APP_ROOT,
    "release",
    "e2e-screenshots"
);
export const E2E_FIXTURES_DIR = path.join(APP_ROOT, "e2e", "fixtures");
export const E2E_SCENES_DIR = path.join(E2E_FIXTURES_DIR, "scenes");
export const E2E_PROJECT_PATH = path.join(E2E_ARTIFACTS_DIR, "project.e2e.iot");
export const E2E_CAPTURE_PATH = path.join(E2E_ARTIFACTS_DIR, "capture.e2e.png");
export const E2E_EXPORT_PATH = path.join(E2E_ARTIFACTS_DIR, "export.e2e.png");

const E2E_RESET_FILES = [E2E_PROJECT_PATH, E2E_CAPTURE_PATH, E2E_EXPORT_PATH];
const FIXTURE_APP_CONFIG_PATH_CANDIDATES = [
    path.join(E2E_FIXTURES_DIR, "app.config.json"),
    path.join(E2E_FIXTURES_DIR, "project", "config.json"),
];

type WindowLayoutConfig = {
    pos: [number, number];
    size: [number, number];
};

type FixtureAppConfig = {
    window?: WindowLayoutConfig;
    imageSettingsWindow?: WindowLayoutConfig;
};

const assertBuildOutput = (): void => {
    if (!fs.existsSync(OUT_MAIN_PATH)) {
        throw new Error(
            `Missing build output: ${OUT_MAIN_PATH}. Run \"pnpm run build\" before e2e.`
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
        IOT_INTERNAL_E2E: "1",
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
    await ensureE2EBridge(page);

    return { app, page };
};

const isValidWindowLayoutConfig = (
    value: unknown
): value is WindowLayoutConfig => {
    if (!value || typeof value !== "object") {
        return false;
    }

    const candidate = value as {
        pos?: unknown;
        size?: unknown;
    };

    return (
        Array.isArray(candidate.pos) &&
        candidate.pos.length === 2 &&
        candidate.pos.every((item) => typeof item === "number") &&
        Array.isArray(candidate.size) &&
        candidate.size.length === 2 &&
        candidate.size.every((item) => typeof item === "number")
    );
};

export const loadFixtureAppConfig = (): FixtureAppConfig | null => {
    for (const filePath of FIXTURE_APP_CONFIG_PATH_CANDIDATES) {
        if (!fs.existsSync(filePath)) {
            continue;
        }

        const parsed = JSON.parse(fs.readFileSync(filePath, "utf-8")) as {
            window?: unknown;
            imageSettingsWindow?: unknown;
        };

        const config: FixtureAppConfig = {};
        if (isValidWindowLayoutConfig(parsed.window)) {
            config.window = parsed.window;
        }
        if (isValidWindowLayoutConfig(parsed.imageSettingsWindow)) {
            config.imageSettingsWindow = parsed.imageSettingsWindow;
        }

        return config;
    }

    return null;
};

const toBounds = (layout: WindowLayoutConfig) => ({
    x: layout.pos[0],
    y: layout.pos[1],
    width: layout.size[0],
    height: layout.size[1],
});

export const applyMainWindowLayout = async (
    app: ElectronApplication,
    page: Page,
    config: FixtureAppConfig | null
): Promise<void> => {
    if (!config?.window) {
        return;
    }

    const browserWindow = await app.browserWindow(page);
    const bounds = toBounds(config.window);
    await browserWindow.evaluate(
        (windowRef, nextBounds) => {
            windowRef.setBounds(nextBounds);
        },
        bounds
    );
    await page.waitForTimeout(120);
};

export const applyImageSettingsWindowLayout = async (
    app: ElectronApplication,
    settingsPage: Page,
    config: FixtureAppConfig | null
): Promise<void> => {
    if (!config?.imageSettingsWindow) {
        return;
    }

    const browserWindow = await app.browserWindow(settingsPage);
    const bounds = toBounds(config.imageSettingsWindow);
    await browserWindow.evaluate(
        (windowRef, nextBounds) => {
            windowRef.setBounds(nextBounds);
        },
        bounds
    );
    await settingsPage.waitForTimeout(120);
};

export const ensureE2EBridge = async (page: Page): Promise<void> => {
    await page.waitForFunction(() => Boolean(window.__IOT_E2E__));
};

export const getE2EStatus = async (page: Page): Promise<E2EControlStatus> => {
    await ensureE2EBridge(page);
    return page.evaluate(async () => {
        const bridge = (window as { __IOT_E2E__?: unknown }).__IOT_E2E__ as
            | { getStatus: () => Promise<E2EControlStatus> }
            | undefined;
        if (!bridge) {
            throw new Error("E2E bridge is not available in renderer.");
        }
        return bridge.getStatus();
    });
};

export const getE2EState = async (
    page: Page
): Promise<{
    imageCount: number;
    dimensionLineCount: number;
    selectedImageId: string | null;
    selectedDimensionLineId: string | null;
    interactionMode: string;
    unit: string;
    unitFactor: number;
    windowColor: string;
    isUIHidden: boolean;
}> => {
    await ensureE2EBridge(page);
    return page.evaluate(() => {
        const bridge = (window as { __IOT_E2E__?: unknown }).__IOT_E2E__ as
            | {
                getState: () => {
                    imageCount: number;
                    dimensionLineCount: number;
                    selectedImageId: string | null;
                    selectedDimensionLineId: string | null;
                    interactionMode: string;
                    unit: string;
                    unitFactor: number;
                    windowColor: string;
                    isUIHidden: boolean;
                };
            }
            | undefined;
        if (!bridge) {
            throw new Error("E2E bridge is not available in renderer.");
        }
        return bridge.getState();
    });
};

export const waitForE2EStable = async (
    page: Page,
    request?: E2EWaitStableRequest
): Promise<E2EWaitStableResult> => {
    await ensureE2EBridge(page);
    return page.evaluate(async (waitRequest) => {
        const bridge = (window as { __IOT_E2E__?: unknown }).__IOT_E2E__ as
            | {
                waitStable: (
                    request?: E2EWaitStableRequest
                ) => Promise<E2EWaitStableResult>;
            }
            | undefined;
        if (!bridge) {
            throw new Error("E2E bridge is not available in renderer.");
        }
        return bridge.waitStable(waitRequest);
    }, request);
};

export const captureViaE2E = async (
    page: Page,
    request?: E2ECaptureRequest
): Promise<CaptureResult | null> => {
    await ensureE2EBridge(page);
    return page.evaluate(async (captureRequest) => {
        const bridge = (window as { __IOT_E2E__?: unknown }).__IOT_E2E__ as
            | {
                capture: (
                    request?: E2ECaptureRequest
                ) => Promise<CaptureResult | null>;
            }
            | undefined;
        if (!bridge) {
            throw new Error("E2E bridge is not available in renderer.");
        }
        return bridge.capture(captureRequest);
    }, request);
};

export const applyFixtureScene = async (
    page: Page,
    sceneFileName = "default.scene.json",
    options?: {
        requireStable?: boolean;
        timeoutMs?: number;
    }
): Promise<void> => {
    const scenePath = path.join(E2E_SCENES_DIR, sceneFileName);
    await ensureE2EBridge(page);
    await page.evaluate(async (payload) => {
        const requireStable = payload.requireStable ?? true;
        const timeoutMs = payload.timeoutMs ?? 20000;

        const bridge = (window as { __IOT_E2E__?: unknown }).__IOT_E2E__ as
            | {
                  setSceneFromPath: (
                      scenePath: string
                  ) => Promise<E2EWaitStableResult>;
                  waitStable: (
                      request?: E2EWaitStableRequest
                  ) => Promise<E2EWaitStableResult>;
              }
            | undefined;
        if (!bridge) {
            throw new Error("E2E bridge is not available in renderer.");
        }

        const result = await bridge.setSceneFromPath(payload.scenePath);
        if (!requireStable) {
            return;
        }

        let stableResult = result;
        if (!stableResult.stable) {
            stableResult = await bridge.waitStable({ timeoutMs });
        }
        if (!stableResult.stable) {
            throw new Error(
                `Renderer did not reach stable state after setSceneFromPath. elapsedMs=${stableResult.elapsedMs}`
            );
        }
    }, { scenePath, ...options });
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

export const openImageSettingsWindow = async (
    app: ElectronApplication,
    page: Page
): Promise<Page> => {
    const existing = app.windows().find((windowPage) => windowPage !== page);
    if (existing) {
        await existing.getByTestId("settings.app.root").waitFor({
            state: "visible",
        });
        return existing;
    }

    const settingsWindowPromise = app.waitForEvent("window");
    await clickAppMenuItem(page, "main.menu.item.open-image-settings");
    const settingsPage = await settingsWindowPromise;
    await settingsPage.getByTestId("settings.app.root").waitFor({
        state: "visible",
    });
    return settingsPage;
};
