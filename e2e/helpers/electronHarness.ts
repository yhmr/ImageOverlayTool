import childProcess from "child_process";
import fs from "fs";
import path from "path";
import { _electron as electron, ElectronApplication, Page } from "playwright";

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
const CONTROL_COMMAND_TIMEOUT_MS = 20000;

type WindowLayoutConfig = {
    pos: [number, number];
    size: [number, number];
};

type FixtureAppConfig = {
    window?: WindowLayoutConfig;
    imageSettingsWindow?: WindowLayoutConfig;
};

type PngArtifactMetadata = {
    exists: boolean;
    fileSize: number;
    width: number;
    height: number;
    isValidPng: boolean;
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

const executeElectronCli = (
    args: string[],
    timeoutMs = CONTROL_COMMAND_TIMEOUT_MS
): void => {
    const electronPath = require("electron") as string;
    const env = { ...process.env };
    delete env.ELECTRON_RUN_AS_NODE;

    const result = childProcess.spawnSync(electronPath, [APP_ROOT, ...args], {
        env,
        encoding: "utf8",
        windowsHide: true,
        timeout: timeoutMs,
        stdio: ["ignore", "pipe", "pipe"],
    });

    if (result.error) {
        throw new Error(
            `Failed to execute electron CLI: ${result.error.message}`
        );
    }

    if (typeof result.status === "number" && result.status !== 0) {
        const stdout = result.stdout ? String(result.stdout).trim() : "";
        const stderr = result.stderr ? String(result.stderr).trim() : "";
        const details = [stderr, stdout].filter(Boolean).join("\n");
        throw new Error(
            `Electron CLI exited with code ${result.status}: ${args.join(" ")}${details ? `\n${details}` : ""}`
        );
    }
};

interface LaunchElectronAppOptions {
    appArgs?: string[];
}

const normalizeLaunchArgs = (appArgs: string[]): string[] => {
    if (appArgs.length === 0) {
        return ["startup", "--silent"];
    }

    if (appArgs[0] === "startup") {
        return appArgs.includes("--silent")
            ? appArgs
            : ["startup", "--silent", ...appArgs.slice(1)];
    }

    return ["startup", "--silent", ...appArgs];
};

const launchElectronApp = async (
    options: LaunchElectronAppOptions = {}
): Promise<{
    app: ElectronApplication;
    page: Page;
}> => {
    assertBuildOutput();
    resetArtifacts();

    const electronPath = require("electron") as string;
    const appArgs = normalizeLaunchArgs(options.appArgs ?? []);
    const env = {
        ...process.env,
        NODE_ENV: "test",
    };
    delete env.ELECTRON_RUN_AS_NODE;

    const app = await electron.launch({
        executablePath: electronPath,
        args: [APP_ROOT, ...appArgs],
        env,
    });

    const page = await app.firstWindow();
    await page.getByTestId("main.app.root").waitFor({ state: "attached" });
    return { app, page };
};

export const resolveFixtureScenePath = (sceneFileName: string): string =>
    path.join(E2E_SCENES_DIR, sceneFileName);

export const runControlCommand = async (args: string[]): Promise<void> => {
    const normalizedArgs = args.includes("--non-interactive")
        ? args
        : ["--non-interactive", ...args];
    executeElectronCli(["control", ...normalizedArgs]);
};

export const launchE2EApp = async (
    options: { appArgs?: string[] } = {}
): Promise<{
    app: ElectronApplication;
    page: Page;
}> => {
    return launchElectronApp({
        appArgs: options.appArgs,
    });
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

export const waitForE2EStable = async (
    page: Page,
    request?: { timeoutMs?: number }
): Promise<{ stable: true; elapsedMs: number }> => {
    const startedAt = Date.now();
    const timeoutMs = request?.timeoutMs ?? 5000;

    await page.getByTestId("main.app.root").waitFor({
        state: "visible",
        timeout: timeoutMs,
    });
    await page.waitForTimeout(250);

    return {
        stable: true,
        elapsedMs: Date.now() - startedAt,
    };
};

export const applyFixtureScene = async (
    page: Page,
    sceneFileName = "default.scene.json"
): Promise<void> => {
    const scenePath = resolveFixtureScenePath(sceneFileName);
    await runControlCommand(["--switch-scene", scenePath]);
    await waitForE2EStable(page, { timeoutMs: 7000 });
};

const PNG_SIGNATURE = Buffer.from([
    0x89,
    0x50,
    0x4e,
    0x47,
    0x0d,
    0x0a,
    0x1a,
    0x0a,
]);
const PNG_IHDR_MIN_LENGTH = 24;

export const readPngArtifactMetadata = (filePath: string): PngArtifactMetadata => {
    if (!fs.existsSync(filePath)) {
        return {
            exists: false,
            fileSize: 0,
            width: 0,
            height: 0,
            isValidPng: false,
        };
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    if (fileSize < PNG_IHDR_MIN_LENGTH) {
        return {
            exists: true,
            fileSize,
            width: 0,
            height: 0,
            isValidPng: false,
        };
    }

    const buffer = fs.readFileSync(filePath);
    const signature = buffer.subarray(0, PNG_SIGNATURE.length);
    const hasValidSignature = signature.equals(PNG_SIGNATURE);
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);

    return {
        exists: true,
        fileSize,
        width,
        height,
        isValidPng: hasValidSignature && width > 0 && height > 0,
    };
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
