import { BrowserWindow } from "electron";

import { registerAppConfigHandlers } from "../ipc/appConfig";
import { registerCaptureHandlers } from "../ipc/capture";
import { registerImageSettingsWindowHandlers } from "../ipc/imageSettingsWindow";
import { registerLicenseIpc } from "../ipc/license";
import { registerLogHandlers } from "../ipc/log";
import { registerProjectHandlers } from "../ipc/project";
import { registerSceneHandlers } from "../ipc/scene";
import { registerWindowHandlers } from "../ipc/window";
import type { IProjectRepository } from "../repositories/ProjectRepository";
import type { ISettingsRepository } from "../repositories/SettingsRepository";
import type { IWindowRepository } from "../repositories/WindowRepository";
import type { WindowManager } from "../windows/windowManager";

interface CoreIpcRegistrationDeps {
    settingsRepository: ISettingsRepository;
    windowRepository: IWindowRepository;
    projectRepository: IProjectRepository;
    windowManager: WindowManager;
}

export const registerEarlyIpcHandlers = (): void => {
    // app.ready 前に登録可能なハンドラ
    registerLogHandlers();
};

export const registerCoreIpcHandlers = ({
    settingsRepository,
    windowRepository,
    projectRepository,
    windowManager,
}: CoreIpcRegistrationDeps): void => {
    registerAppConfigHandlers(settingsRepository, windowRepository);

    registerProjectHandlers(projectRepository);
    registerSceneHandlers();

    registerImageSettingsWindowHandlers(windowManager);
    registerLicenseIpc();

    registerCaptureHandlers();
};

export const registerWindowIpcHandlers = (mainWindow: BrowserWindow): void => {
    registerWindowHandlers(mainWindow);
};
