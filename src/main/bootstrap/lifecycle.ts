import { app, crashReporter, dialog } from "electron";

import log from "../logger";
import type { WindowManager } from "../windows/windowManager";

export const registerProcessErrorHandlers = (): void => {
    crashReporter.start({
        productName: "ImageOverlayTool",
        companyName: "yhmr",
        submitURL: "",
        uploadToServer: false,
        compress: true,
    });

    process.on("uncaughtException", (error) => {
        log.error("Uncaught Exception:", error);
        dialog.showErrorBox(
            "An unexpected error occurred",
            `A critical error occurred in the main process:\n\n${error.message}\n\nplease copy this message and report it to the developer.`
        );
    });

    process.on("unhandledRejection", (reason) => {
        log.error("Unhandled Rejection:", reason);
        dialog.showErrorBox(
            "An unexpected error occurred",
            `An unhandled rejection occurred in the main process:\n\n${reason}\n\nplease copy this message and report it to the developer.`
        );
    });

    app.on("render-process-gone", (_event, webContents, details) => {
        log.error(
            `Render process gone: reason=${details.reason} exitCode=${
                details.exitCode
            } url=${webContents.getURL()}`
        );
    });

    app.on("child-process-gone", (_event, details) => {
        log.error(
            `Child process gone: type=${details.type} reason=${details.reason} exitCode=${details.exitCode}`
        );
    });
};

export const registerShutdownHandlers = (
    windowManager: WindowManager
): void => {
    // アプリケーションが閉じられた際の処理
    app.once("window-all-closed", () => {
        log.info("All windows closed. Quitting application.");
        windowManager.cleanup();
        app.quit();
    });

    // アプリ終了処理開始時 (Cmd+Qなど)
    app.on("before-quit", () => {
        windowManager.willQuit();
    });
};
