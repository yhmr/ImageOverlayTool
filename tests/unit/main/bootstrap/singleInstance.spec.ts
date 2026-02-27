import { beforeEach, describe, expect, it, vi } from "vitest";
import { app, dialog } from "electron";

import log from "@/main/logger";
import { registerSingleInstanceHandlers } from "@/main/bootstrap/singleInstance";
import { resolveStartupLaunchPlan } from "@/main/bootstrap/startupLaunch";
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

vi.mock("@/main/bootstrap/startupLaunch", () => ({
    resolveStartupLaunchPlan: vi.fn(),
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
        | ((event: unknown, commandLine: string[]) => void | Promise<void>)
        | null;
    let openFileHandler: ((event: { preventDefault: () => void }, path: string) => void) | null;

    beforeEach(() => {
        vi.clearAllMocks();
        secondInstanceHandler = null;
        openFileHandler = null;

        vi.mocked(app.on).mockImplementation((eventName: string, handler: unknown) => {
            if (eventName === "second-instance") {
                secondInstanceHandler = handler as (
                    event: unknown,
                    commandLine: string[]
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
        vi.mocked(resolveStartupLaunchPlan).mockResolvedValue({
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
        });

        const windowManager = {
            getMainWindow: vi.fn(() => mainWindow),
            applyLaunchIntent: vi.fn(),
            openFile: vi.fn(),
        };

        registerSingleInstanceHandlers(windowManager as never);
        await secondInstanceHandler?.({}, ["node", "index.js", "--images"]);

        expect(resolveStartupLaunchPlan).toHaveBeenCalledWith(
            ["node", "index.js", "--images"],
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

    it("queues plan handling even when main window is unavailable", async () => {
        const launchIntent: LaunchIntent = {
            window: { alwaysOnTop: false, clickThrough: false },
            images: [],
        };
        vi.mocked(resolveStartupLaunchPlan).mockResolvedValue({
            skipSplash: false,
            filePath: "C:/tmp/queued.scene.json",
            launchIntent,
            windowOptions: {
                fullscreen: false,
                minimize: false,
            },
            warnings: [],
        });

        const windowManager = {
            getMainWindow: vi.fn(() => null),
            applyLaunchIntent: vi.fn(),
            openFile: vi.fn(),
        };

        registerSingleInstanceHandlers(windowManager as never);
        await secondInstanceHandler?.({}, ["node", "index.js", "queued.scene.json"]);

        expect(windowManager.applyLaunchIntent).toHaveBeenCalledWith(launchIntent);
        expect(windowManager.openFile).toHaveBeenCalledWith(
            "C:/tmp/queued.scene.json"
        );
    });

    it("shows error dialog when second-instance args are invalid", async () => {
        vi.mocked(resolveStartupLaunchPlan).mockRejectedValue(
            new Error("invalid option")
        );

        const windowManager = {
            getMainWindow: vi.fn(() => createMainWindow()),
            applyLaunchIntent: vi.fn(),
            openFile: vi.fn(),
        };

        registerSingleInstanceHandlers(windowManager as never);
        await secondInstanceHandler?.({}, ["node", "index.js", "--scene"]);

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
