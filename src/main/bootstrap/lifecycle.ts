import { app, crashReporter } from "electron";

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
    });

    process.on("unhandledRejection", (reason) => {
        log.error("Unhandled Rejection:", reason);
    });

    app.on("render-process-gone", (_event, webContents, details) => {
        log.error(
            `Render process gone: reason=${details.reason} exitCode=${details.exitCode} url=${webContents.getURL()}`
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
