import { app } from "electron";

import log from "../logger";
import type { WindowManager } from "../windows/windowManager";

export const registerProcessErrorHandlers = (): void => {
    process.on("uncaughtException", (error) => {
        log.error("Uncaught Exception:", error);
    });

    process.on("unhandledRejection", (reason) => {
        log.error("Unhandled Rejection:", reason);
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
