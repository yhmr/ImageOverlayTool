import { beforeEach, describe, expect, it, vi } from "vitest";
import { app, dialog } from "electron";

import log from "@/main/logger";
import { registerSingleInstanceHandlers } from "@/main/bootstrap/singleInstance";
import { resetSecondInstanceErrorDialogStateForTest } from "@/main/bootstrap/cliErrorHandler";
import {
    CliRouteParseError,
    resolveSecondInstanceCliRoute,
} from "@/main/bootstrap/cliRouter";
import {
    executeSecondInstanceCommand,
} from "@/main/bootstrap/secondInstanceCommand";
import type { LaunchIntent } from "@/shared/types/LaunchIntent";

vi.mock("electron", () => ({
    app: {
        on: vi.fn(),
        isPackaged: false,
    },
    dialog: {
        showErrorBox: vi.fn(),
    },
}));

vi.mock("@/main/logger", () => ({
    default: {
        error: vi.fn(),
        warn: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
    },
}));

vi.mock("@/main/bootstrap/cliRouter", async () => {
    const actual = await vi.importActual<typeof import("@/main/bootstrap/cliRouter")>(
        "@/main/bootstrap/cliRouter"
    );
    return {
        ...actual,
        resolveSecondInstanceCliRoute: vi.fn(),
    };
});

vi.mock("@/main/bootstrap/secondInstanceCommand", () => ({
    executeSecondInstanceCommand: vi.fn(),
}));

const createMainWindow = () => ({
    isMinimized: vi.fn(() => false),
    restore: vi.fn(),
    focus: vi.fn(),
    getPosition: vi.fn(() => [120, 80]),
    getSize: vi.fn(() => [1280, 720]),
    setBounds: vi.fn(),
    setFullScreen: vi.fn(),
    minimize: vi.fn(),
});

describe("singleInstance", () => {
    let secondInstanceHandler:
        | ((
              event: unknown,
              commandLine: string[],
              workingDirectory?: string,
              additionalData?: unknown
          ) => void | Promise<void>)
        | null;
    let openFileHandler: ((event: { preventDefault: () => void }, path: string) => void) | null;

    beforeEach(() => {
        vi.clearAllMocks();
        resetSecondInstanceErrorDialogStateForTest();
        secondInstanceHandler = null;
        openFileHandler = null;
        vi.mocked(executeSecondInstanceCommand).mockResolvedValue(undefined);
        vi.mocked(resolveSecondInstanceCliRoute).mockResolvedValue({
            kind: "startup",
            startupLaunchPlan: {
                skipSplash: false,
                filePath: undefined,
                launchIntent: undefined,
                windowOptions: {
                    fullscreen: false,
                    minimize: false,
                },
                warnings: [],
            },
        });

        vi.mocked(app.on).mockImplementation((eventName: string, handler: unknown) => {
            if (eventName === "second-instance") {
                secondInstanceHandler = handler as (
                    event: unknown,
                    commandLine: string[],
                    workingDirectory?: string,
                    additionalData?: unknown
                ) => void | Promise<void>;
            }
            if (eventName === "open-file") {
                openFileHandler = handler as (
                    event: { preventDefault: () => void },
                    path: string
                ) => void;
            }
            return app;
        });
    });

    it("applies second-instance launch plan including window options", async () => {
        const mainWindow = createMainWindow();
        mainWindow.isMinimized.mockReturnValue(true);
        const launchIntent: LaunchIntent = {
            window: { alwaysOnTop: true, clickThrough: false },
            images: [],
        };
        vi.mocked(resolveSecondInstanceCliRoute).mockResolvedValue({
            kind: "startup",
            startupLaunchPlan: {
                skipSplash: false,
                filePath: "C:/tmp/sample.iot",
                launchIntent,
                windowOptions: {
                    position: { x: 1, y: 2 },
                    size: { width: 800, height: 600 },
                    fullscreen: true,
                    minimize: true,
                },
                warnings: ["test warning"],
            },
        });

        const windowManager = {
            getMainWindow: vi.fn(() => mainWindow),
            applyLaunchIntent: vi.fn(),
            openFile: vi.fn(),
        };

        registerSingleInstanceHandlers(windowManager as never);
        await secondInstanceHandler?.({}, [
            "node",
            "index.js",
            "startup",
            "--images",
        ], undefined, {
            appArgs: ["startup", "--images"],
        });

        expect(resolveSecondInstanceCliRoute).toHaveBeenCalledWith(
            ["node", "index.js", "startup", "--images"],
            false
        );
        expect(mainWindow.restore).toHaveBeenCalledOnce();
        expect(mainWindow.focus).toHaveBeenCalledOnce();
        expect(mainWindow.setBounds).toHaveBeenCalledWith({
            x: 1,
            y: 2,
            width: 800,
            height: 600,
        });
        expect(mainWindow.setFullScreen).toHaveBeenCalledWith(true);
        expect(mainWindow.minimize).toHaveBeenCalledOnce();
        expect(windowManager.applyLaunchIntent).toHaveBeenCalledWith(launchIntent);
        expect(windowManager.openFile).toHaveBeenCalledWith("C:/tmp/sample.iot");
        expect(log.warn).toHaveBeenCalledWith("[startup] test warning");
    });

    it("executes second-instance command and skips startup launch parsing", async () => {
        const mainWindow = createMainWindow();
        vi.mocked(resolveSecondInstanceCliRoute).mockResolvedValue({
            kind: "control",
            command: {
                kind: "app-control",
                command: {
                    kind: "set-opacity",
                    opacity: 0.3,
                },
            },
        });

        const windowManager = {
            getMainWindow: vi.fn(() => mainWindow),
            applyLaunchIntent: vi.fn(),
            openFile: vi.fn(),
        };

        registerSingleInstanceHandlers(windowManager as never);
        await secondInstanceHandler?.({}, [
            "node",
            "index.js",
            "control",
            "--set-opacity",
            "30",
        ], undefined, {
            appArgs: ["control", "--set-opacity", "30"],
        });

        expect(resolveSecondInstanceCliRoute).toHaveBeenCalledWith(
            ["node", "index.js", "control", "--set-opacity", "30"],
            false
        );
        expect(executeSecondInstanceCommand).toHaveBeenCalledWith(
            {
                kind: "app-control",
                command: {
                    kind: "set-opacity",
                    opacity: 0.3,
                },
            },
            windowManager
        );
    });

    it("routes control subcommand to second-instance command path", async () => {
        const mainWindow = createMainWindow();
        vi.mocked(resolveSecondInstanceCliRoute).mockResolvedValue({
            kind: "control",
            command: {
                kind: "app-control",
                command: {
                    kind: "set-opacity",
                    opacity: 0.5,
                },
            },
        });

        const windowManager = {
            getMainWindow: vi.fn(() => mainWindow),
            applyLaunchIntent: vi.fn(),
            openFile: vi.fn(),
        };

        registerSingleInstanceHandlers(windowManager as never);
        await secondInstanceHandler?.(
            {},
            ["node", "index.js", "control", "--set-opacity", "50"],
            undefined,
            {
                appArgs: ["control", "--set-opacity", "50"],
            }
        );

        expect(resolveSecondInstanceCliRoute).toHaveBeenCalledWith(
            ["node", "index.js", "control", "--set-opacity", "50"],
            false
        );
    });

    it("passes second-instance working directory to route resolver", async () => {
        const windowManager = {
            getMainWindow: vi.fn(() => createMainWindow()),
            applyLaunchIntent: vi.fn(),
            openFile: vi.fn(),
        };

        registerSingleInstanceHandlers(windowManager as never);
        await secondInstanceHandler?.(
            {},
            ["node", "index.js", "control", "--set-opacity", "50"],
            "D:/work/runner",
            {
                appArgs: ["control", "--set-opacity", "50"],
            }
        );

        expect(resolveSecondInstanceCliRoute).toHaveBeenCalledWith(
            ["node", "index.js", "control", "--set-opacity", "50"],
            false,
            "D:/work/runner"
        );
    });

    it("routes startup subcommand to startup launch parsing when no command exists", async () => {
        const launchIntent: LaunchIntent = {
            window: { alwaysOnTop: false, clickThrough: false },
            images: [],
        };
        vi.mocked(resolveSecondInstanceCliRoute).mockResolvedValue({
            kind: "startup",
            startupLaunchPlan: {
                skipSplash: false,
                filePath: undefined,
                launchIntent,
                windowOptions: {
                    fullscreen: false,
                    minimize: false,
                },
                warnings: [],
            },
        });

        const windowManager = {
            getMainWindow: vi.fn(() => createMainWindow()),
            applyLaunchIntent: vi.fn(),
            openFile: vi.fn(),
        };

        registerSingleInstanceHandlers(windowManager as never);
        await secondInstanceHandler?.(
            {},
            ["node", "index.js", "startup", "--images", "sample.png"],
            undefined,
            {
                appArgs: ["startup", "--images", "sample.png"],
            }
        );

        expect(resolveSecondInstanceCliRoute).toHaveBeenCalledWith(
            ["node", "index.js", "startup", "--images", "sample.png"],
            false
        );
    });

    it("shows error dialog when second-instance command args are invalid", async () => {
        vi.mocked(resolveSecondInstanceCliRoute).mockRejectedValue(
            new CliRouteParseError("control", "invalid command option")
        );

        const windowManager = {
            getMainWindow: vi.fn(() => createMainWindow()),
            applyLaunchIntent: vi.fn(),
            openFile: vi.fn(),
        };

        registerSingleInstanceHandlers(windowManager as never);
        await secondInstanceHandler?.({}, [
            "node",
            "index.js",
            "control",
            "--set-opacity",
        ], undefined, {
            appArgs: ["control", "--set-opacity"],
        });

        expect(dialog.showErrorBox).toHaveBeenCalledWith(
            "Invalid second-instance command",
            "invalid command option"
        );
        expect(executeSecondInstanceCommand).not.toHaveBeenCalled();
    });

    it("shows error dialog when second-instance command execution fails", async () => {
        vi.mocked(resolveSecondInstanceCliRoute).mockResolvedValue({
            kind: "control",
            command: {
                kind: "export",
                outputPath: "C:/tmp/overlay.png",
            },
        });
        vi.mocked(executeSecondInstanceCommand).mockRejectedValue(
            new Error("export failed")
        );

        const windowManager = {
            getMainWindow: vi.fn(() => createMainWindow()),
            applyLaunchIntent: vi.fn(),
            openFile: vi.fn(),
        };

        registerSingleInstanceHandlers(windowManager as never);
        await secondInstanceHandler?.({}, [
            "node",
            "index.js",
            "control",
            "--export",
            "overlay.png",
        ], undefined, {
            appArgs: ["control", "--export", "overlay.png"],
        });

        expect(dialog.showErrorBox).toHaveBeenCalledWith(
            "Second-instance command failed",
            "export failed"
        );
    });

    it("queues plan handling even when main window is unavailable", async () => {
        const launchIntent: LaunchIntent = {
            window: { alwaysOnTop: false, clickThrough: false },
            images: [],
        };
        vi.mocked(resolveSecondInstanceCliRoute).mockResolvedValue({
            kind: "startup",
            startupLaunchPlan: {
                skipSplash: false,
                filePath: "C:/tmp/queued.scene.json",
                launchIntent,
                windowOptions: {
                    fullscreen: false,
                    minimize: false,
                },
                warnings: [],
            },
        });

        const windowManager = {
            getMainWindow: vi.fn(() => null),
            applyLaunchIntent: vi.fn(),
            openFile: vi.fn(),
        };

        registerSingleInstanceHandlers(windowManager as never);
        await secondInstanceHandler?.({}, ["node", "index.js", "queued.scene.json"], undefined, {
            appArgs: ["queued.scene.json"],
        });

        expect(windowManager.applyLaunchIntent).toHaveBeenCalledWith(launchIntent);
        expect(windowManager.openFile).toHaveBeenCalledWith(
            "C:/tmp/queued.scene.json"
        );
    });

    it("shows error dialog when second-instance args are invalid", async () => {
        vi.mocked(resolveSecondInstanceCliRoute).mockRejectedValue(
            new CliRouteParseError("startup", "invalid option")
        );

        const windowManager = {
            getMainWindow: vi.fn(() => createMainWindow()),
            applyLaunchIntent: vi.fn(),
            openFile: vi.fn(),
        };

        registerSingleInstanceHandlers(windowManager as never);
        await secondInstanceHandler?.({}, [
            "node",
            "index.js",
            "startup",
            "--scene",
        ], undefined, {
            appArgs: ["startup", "--scene"],
        });

        expect(dialog.showErrorBox).toHaveBeenCalledWith(
            "Invalid startup options",
            "invalid option"
        );
        expect(windowManager.applyLaunchIntent).not.toHaveBeenCalled();
        expect(windowManager.openFile).not.toHaveBeenCalled();
    });

    it("handles macOS open-file event", () => {
        const windowManager = {
            getMainWindow: vi.fn(() => createMainWindow()),
            applyLaunchIntent: vi.fn(),
            openFile: vi.fn(),
        };

        registerSingleInstanceHandlers(windowManager as never);
        const event = { preventDefault: vi.fn() };
        openFileHandler?.(event, "C:/tmp/from-finder.iot");

        expect(event.preventDefault).toHaveBeenCalledOnce();
        expect(windowManager.openFile).toHaveBeenCalledWith(
            "C:/tmp/from-finder.iot"
        );
    });
});
