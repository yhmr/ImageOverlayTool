import { BrowserWindow } from "electron";

import type { E2ERuntimeConfig } from "../e2e/runtimeConfig";
import { registerAppConfigHandlers } from "../ipc/appConfig";
import { registerCaptureHandlers } from "../ipc/capture";
import { registerE2EControlHandlers } from "../ipc/e2eControl";
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
    e2eConfig: E2ERuntimeConfig;
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
    e2eConfig,
}: CoreIpcRegistrationDeps): void => {
    registerAppConfigHandlers(settingsRepository, windowRepository);

    registerProjectHandlers(
        projectRepository,
        e2eConfig.enabled
            ? {
                  testMode: {
                      enabled: true,
                      projectFilePath: e2eConfig.projectFilePath,
                  },
              }
            : undefined
    );
    registerSceneHandlers();

    registerImageSettingsWindowHandlers(windowManager);
    registerLicenseIpc();

    registerCaptureHandlers(
        e2eConfig.enabled
            ? {
                  testMode: {
                      enabled: true,
                      captureFilePath: e2eConfig.captureFilePath,
                      exportImagePath: e2eConfig.exportImagePath,
                      fixedNow: e2eConfig.fixedNow,
                  },
              }
            : undefined
    );

    registerE2EControlHandlers({ e2eConfig });
};

export const registerWindowIpcHandlers = (mainWindow: BrowserWindow): void => {
    registerWindowHandlers(mainWindow);
};
