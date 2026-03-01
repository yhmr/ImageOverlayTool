import type { BrowserWindow } from "electron";

export type MainWindowRequiredOption =
    | "--capture-window"
    | "--save-stage"
    | "--wait-stable";

export const assertMainWindowAvailable = (
    mainWindow: BrowserWindow | null,
    optionName: MainWindowRequiredOption
): BrowserWindow => {
    if (!mainWindow || mainWindow.isDestroyed()) {
        throw new Error(`Main window is not available for ${optionName}.`);
    }
    return mainWindow;
};
