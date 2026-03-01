import type { BrowserWindow } from "electron";

import log from "../../logger";
import type { WindowManager } from "../../windows/windowManager";
import type { WaitStableSecondInstanceCommand } from "./types";
import { assertMainWindowAvailable } from "./windowAvailability";

const WAIT_STABLE_POLL_INTERVAL_MS = 50;
const WAIT_STABLE_SETTLE_MS = 150;

const sleep = async (ms: number): Promise<void> => {
    await new Promise<void>((resolve) => {
        setTimeout(resolve, ms);
    });
};

const isMainWindowStable = (mainWindow: BrowserWindow): boolean => {
    if (mainWindow.isDestroyed()) {
        return false;
    }

    const webContents = mainWindow.webContents;
    return (
        mainWindow.isVisible() &&
        !webContents.isLoading() &&
        !webContents.isLoadingMainFrame()
    );
};

const waitForMainWindowStable = async (
    mainWindow: BrowserWindow,
    timeoutMs: number
): Promise<void> => {
    const deadline = Date.now() + timeoutMs;

    if (mainWindow.isMinimized()) {
        mainWindow.restore();
    }
    if (!mainWindow.isVisible()) {
        mainWindow.show();
    }

    while (Date.now() < deadline) {
        if (mainWindow.isDestroyed()) {
            throw new Error("Main window is not available for --wait-stable.");
        }

        if (isMainWindowStable(mainWindow)) {
            const settleDelayMs = Math.min(
                WAIT_STABLE_SETTLE_MS,
                Math.max(0, deadline - Date.now())
            );
            if (settleDelayMs > 0) {
                await sleep(settleDelayMs);
            }
            if (isMainWindowStable(mainWindow)) {
                return;
            }
        }

        const pollDelayMs = Math.min(
            WAIT_STABLE_POLL_INTERVAL_MS,
            Math.max(1, deadline - Date.now())
        );
        await sleep(pollDelayMs);
    }

    throw new Error(`--wait-stable timed out after ${timeoutMs}ms.`);
};

export const executeWaitStableCommand = async (
    command: WaitStableSecondInstanceCommand,
    windowManager: WindowManager
): Promise<void> => {
    const mainWindow = assertMainWindowAvailable(
        windowManager.getMainWindow(),
        "--wait-stable"
    );
    await waitForMainWindowStable(mainWindow, command.timeoutMs);
    log.info(
        `[second-instance] Main window became stable within ${command.timeoutMs}ms`
    );
};
