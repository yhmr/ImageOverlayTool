import { app, dialog, type BrowserWindow } from "electron";

import log from "../logger";
import type { WindowManager } from "../windows/windowManager";
import {
    resolveStartupLaunchPlan,
    type StartupWindowOptions,
} from "./startupLaunch";

export const acquireSingleInstanceLock = (isE2EMode: boolean): boolean => {
    if (isE2EMode) {
        log.info("Single instance lock disabled in e2e mode.");
        return true;
    }

    return app.requestSingleInstanceLock();
};

export const registerSingleInstanceHandlers = (
    windowManager: WindowManager
): void => {
    const applyWindowOptions = (
        mainWindow: BrowserWindow,
        options: StartupWindowOptions
    ): void => {
        const [currentX, currentY] = mainWindow.getPosition();
        const [currentWidth, currentHeight] = mainWindow.getSize();

        if (options.position || options.size) {
            mainWindow.setBounds({
                x: options.position?.x ?? currentX,
                y: options.position?.y ?? currentY,
                width: options.size?.width ?? currentWidth,
                height: options.size?.height ?? currentHeight,
            });
        }

        if (options.fullscreen) {
            mainWindow.setFullScreen(true);
        }

        if (options.minimize) {
            mainWindow.minimize();
        }
    };

    // 2つ目のインスタンスが起動されたときの処理
    app.on("second-instance", async (_event, commandLine) => {
        const mainWindow = windowManager.getMainWindow();
        if (mainWindow) {
            if (mainWindow.isMinimized()) {
                mainWindow.restore();
            }
            mainWindow.focus();
        }

        let startupLaunchPlan: Awaited<
            ReturnType<typeof resolveStartupLaunchPlan>
        >;
        try {
            startupLaunchPlan = await resolveStartupLaunchPlan(
                commandLine,
                app.isPackaged
            );
        } catch (error) {
            const message =
                error instanceof Error ? error.message : String(error);
            log.error("Failed to parse second-instance startup options.", {
                message,
            });
            dialog.showErrorBox("Invalid startup options", message);
            return;
        }

        if (mainWindow) {
            applyWindowOptions(mainWindow, startupLaunchPlan.windowOptions);
        }

        startupLaunchPlan.warnings.forEach((warning) => {
            log.warn(`[startup] ${warning}`);
        });

        if (startupLaunchPlan.launchIntent) {
            windowManager.applyLaunchIntent(startupLaunchPlan.launchIntent);
        }
        if (startupLaunchPlan.filePath) {
            windowManager.openFile(startupLaunchPlan.filePath);
        }
    });

    // macOSでファイルが開かれたときの処理
    app.on("open-file", (event, path) => {
        event.preventDefault();
        windowManager.openFile(path);
    });
};
