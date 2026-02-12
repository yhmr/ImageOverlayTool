import { app, Menu } from "electron";
import {
    installExtension,
    REDUX_DEVTOOLS,
    REACT_DEVELOPER_TOOLS,
} from "electron-devtools-installer";
import { is } from "@electron-toolkit/utils";

import {
    registerCoreIpcHandlers,
    registerEarlyIpcHandlers,
    registerWindowIpcHandlers,
} from "./bootstrap/ipcRegistration";
import {
    registerProcessErrorHandlers,
    registerShutdownHandlers,
} from "./bootstrap/lifecycle";
import { initializeRuntimeEnvironment } from "./bootstrap/runtime";
import {
    acquireSingleInstanceLock,
    extractLaunchFilePath,
    registerSingleInstanceHandlers,
} from "./bootstrap/singleInstance";
import { resolveE2ERuntimeConfig } from "./e2e/runtimeConfig";
import {
    registerLocalResourceProtocol,
    setupProtocolHandler,
} from "./ipc/protocol";
import log from "./logger";
import { ProjectRepositoryFactory } from "./repositories/ProjectRepositoryFactory";
import { SettingsRepositoryFactory } from "./repositories/SettingsRepositoryFactory";
import { registerAutoUpdater } from "./updater";
import { WindowRepositoryFactory } from "./repositories/WindowRepositoryFactory";
import { WindowManager } from "./windows/windowManager";

const e2eConfig = resolveE2ERuntimeConfig();
initializeRuntimeEnvironment(e2eConfig);

// 永続化レイヤーを先に構築して、以降は依存注入で扱う
const settingsRepository = SettingsRepositoryFactory.create();
const windowRepository = WindowRepositoryFactory.create();
const projectRepository = ProjectRepositoryFactory.create();

// WindowManager はウィンドウ生成・ファイルオープン・ショートカットを一元管理する
const windowManager = new WindowManager(windowRepository);

// ネイティブメニューは使わない
Menu.setApplicationMenu(null);

// 起動初期化: 例外監視/IPC/プロトコルを先に準備
registerEarlyIpcHandlers();
registerProcessErrorHandlers();
registerLocalResourceProtocol();

const gotTheLock = acquireSingleInstanceLock(e2eConfig.enabled);
log.info("Application starting...");

if (!gotTheLock) {
    log.info("Another instance is already running. Quitting.");
    app.quit();
} else {
    registerSingleInstanceHandlers(windowManager);

    app.whenReady().then(async () => {
        log.info("App ready, creating windows...");

        // 1) protocol -> 2) ipc -> 3) window の順で組み立てる
        setupProtocolHandler();

        registerCoreIpcHandlers({
            settingsRepository,
            windowRepository,
            projectRepository,
            windowManager,
            e2eConfig,
        });

        const mainWindow = await windowManager.launchMainWindow({
            skipSplash: e2eConfig.enabled,
        });
        log.info("Main window created.");

        registerWindowIpcHandlers(mainWindow);
        windowManager.registerShortcuts();
        registerAutoUpdater();

        // 起動引数で指定されたファイルを開く
        const launchFilePath = extractLaunchFilePath(
            process.argv,
            app.isPackaged
        );
        if (launchFilePath) {
            windowManager.openFile(launchFilePath);
        }

        // 開発時のみデバッグツールを有効化
        if (is.dev && !e2eConfig.enabled) {
            installExtension([REDUX_DEVTOOLS, REACT_DEVELOPER_TOOLS])
                .then(() => {
                    // noop
                })
                .catch(() => {
                    // noop
                });
        }

        windowManager.openDevTools(mainWindow, e2eConfig.enabled);
    });

    registerShutdownHandlers(windowManager);
}
