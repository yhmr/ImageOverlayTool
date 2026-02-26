import { BrowserWindow } from "electron";
import { ISettingsRepository } from "../repositories/SettingsRepository";
import { IWindowRepository } from "../repositories/WindowRepository";
import { settingsEventContracts } from "../../shared/ipc/contracts";
import { registerSettingsHandlers } from "./appConfig/settingsHandlers";
import { registerTransferHandlers } from "./appConfig/transferHandlers";
import { registerWindowHandlers } from "./appConfig/windowHandlers";
import type { AppConfigHandlerContext } from "./appConfig/types";

export const registerAppConfigHandlers = (
    settingsRepository: ISettingsRepository,
    windowRepository: IWindowRepository
) => {
    const broadcastLanguageUpdated = (language: string) => {
        BrowserWindow.getAllWindows().forEach((win) => {
            win.webContents.send(
                settingsEventContracts.languageUpdated.event,
                language
            );
        });
    };

    const context: AppConfigHandlerContext = {
        settingsRepository,
        windowRepository,
        broadcastLanguageUpdated,
    };

    registerSettingsHandlers(context);
    registerWindowHandlers(context);
    registerTransferHandlers(context);
};
