import { app } from "electron";

import log from "../logger";
import type { WindowManager } from "../windows/windowManager";

export const extractLaunchFilePath = (
    commandLine: string[],
    isPackaged: boolean
): string | undefined => {
    const argv = isPackaged ? commandLine.slice(1) : commandLine.slice(2);
    return argv.find((arg) => !arg.startsWith("--"));
};

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
    // 2つ目のインスタンスが起動されたときの処理
    app.on("second-instance", (_event, commandLine) => {
        const mainWindow = windowManager.getMainWindow();
        if (!mainWindow) {
            return;
        }

        if (mainWindow.isMinimized()) {
            mainWindow.restore();
        }
        mainWindow.focus();

        const filePath = extractLaunchFilePath(commandLine, app.isPackaged);
        if (filePath) {
            windowManager.openFile(filePath);
        }
    });

    // macOSでファイルが開かれたときの処理
    app.on("open-file", (event, path) => {
        event.preventDefault();
        windowManager.openFile(path);
    });
};
