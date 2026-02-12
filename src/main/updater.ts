import { app, dialog } from "electron";
import { autoUpdater } from "electron-updater";

import log from "./logger";

const DEFAULT_FEED_INTERVAL_MS = 1000 * 60 * 60 * 4; // 4h

export const registerAutoUpdater = (): void => {
    if (!app.isPackaged) {
        log.info("Auto update is disabled in development mode.");
        return;
    }

    autoUpdater.logger = log as unknown as typeof autoUpdater.logger;
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;

    autoUpdater.on("checking-for-update", () => {
        log.info("[Updater] Checking for update...");
    });

    autoUpdater.on("update-available", (info) => {
        log.info(`[Updater] Update available: v${info.version}`);
    });

    autoUpdater.on("update-not-available", () => {
        log.info("[Updater] No update available.");
    });

    autoUpdater.on("error", (error) => {
        log.error("[Updater] Update check failed:", error);
    });

    autoUpdater.on("update-downloaded", async (info) => {
        log.info(`[Updater] Update downloaded: v${info.version}`);
        const response = await dialog.showMessageBox({
            type: "info",
            title: "Update Ready",
            message: `Version ${info.version} is ready to install.`,
            detail: "Restart now to apply the update.",
            buttons: ["Restart now", "Later"],
            defaultId: 0,
            cancelId: 1,
        });

        if (response.response === 0) {
            autoUpdater.quitAndInstall();
        }
    });

    void autoUpdater.checkForUpdatesAndNotify();
    setInterval(() => {
        void autoUpdater.checkForUpdates();
    }, DEFAULT_FEED_INTERVAL_MS).unref();
};
