import { app, Menu } from "electron";
import {
    installExtension,
    REDUX_DEVTOOLS,
    REACT_DEVELOPER_TOOLS,
} from "electron-devtools-installer";
import { is } from "@electron-toolkit/utils";

// ロガー（最初に初期化。ファイルの先頭でインポートして初期化コードを実行）
import log from "./logger";
import { registerLogHandlers } from "./ipc/log";

import { registerWindowHandlers } from "./ipc/window";
import { registerAppConfigHandlers } from "./ipc/appConfig";
import {
    registerLocalResourceProtocol,
    setupProtocolHandler,
} from "./ipc/protocol";
import { registerProjectHandlers } from "./ipc/project";
import { registerImageSettingsWindowHandlers } from "./ipc/imageSettingsWindow";

import { SettingsRepositoryFactory } from "./repositories/SettingsRepositoryFactory";
import { WindowRepositoryFactory } from "./repositories/WindowRepositoryFactory";
import { ProjectRepositoryFactory } from "./repositories/ProjectRepositoryFactory";
import { WindowManager } from "./windows/windowManager";

// 開発中のみ、外部からのデバッグ接続(9222)を許可する
if (!app.isPackaged) {
    app.commandLine.appendSwitch("remote-debugging-port", "9222");
}

// リポジトリの作成
const settingsRepository = SettingsRepositoryFactory.create();
const windowRepository = WindowRepositoryFactory.create();
const projectRepository = ProjectRepositoryFactory.create();

// ウィンドウマネージャー
const windowManager = new WindowManager(windowRepository);

// Menu削除
Menu.setApplicationMenu(null);

// ログIPCハンドラー登録（app.ready前に登録可能）
registerLogHandlers();

// グローバル例外ハンドラー
process.on("uncaughtException", (error) => {
    log.error("Uncaught Exception:", error);
});

process.on("unhandledRejection", (reason) => {
    log.error("Unhandled Rejection:", reason);
});

// プロトコルを事前登録
registerLocalResourceProtocol();

// 二重起動防止
const gotTheLock = app.requestSingleInstanceLock();
log.info("Application starting...");

if (!gotTheLock) {
    log.info("Another instance is already running. Quitting.");
    app.quit();
} else {
    // 2つ目のインスタンスが起動されたときの処理
    app.on("second-instance", (_event, commandLine) => {
        // メインウィンドウがあればフォーカスする
        const mainWindow = windowManager.getMainWindow();
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();

            // 引数からファイルパスを取得して開く
            // 本番環境: executePath, filePath
            // 開発環境: electron, ., filePath
            const argv = app.isPackaged
                ? commandLine.slice(1)
                : commandLine.slice(2);
            const filePath = argv.find((arg) => !arg.startsWith("--"));
            if (filePath) {
                windowManager.openFile(filePath);
            }
        }
    });

    // macOSでファイルが開かれたときの処理
    app.on("open-file", (event, path) => {
        event.preventDefault();
        // ready前なら後で処理されるはず（windowManager.openFileの保留ロジック）
        // ready後なら即座に処理される
        windowManager.openFile(path);
    });

    app.whenReady().then(() => {
        log.info("App ready, creating main window...");

        // プロトコルハンドラ登録
        setupProtocolHandler();

        // メインウィンドウを作成
        const mainWindow = windowManager.createMainWindow();
        log.info("Main window created.");

        // IPCハンドラ登録
        registerWindowHandlers(mainWindow);
        registerAppConfigHandlers(settingsRepository, windowRepository);
        registerProjectHandlers(projectRepository);
        registerImageSettingsWindowHandlers(windowManager);

        // グローバルショートカットを登録
        windowManager.registerShortcuts();

        // 起動引数チェック
        const argv = app.isPackaged
            ? process.argv.slice(1)
            : process.argv.slice(2);
        const filePath = argv.find((arg) => !arg.startsWith("--"));
        if (filePath) {
            windowManager.openFile(filePath);
        }

        // 開発時はデベロッパーツールを開く
        if (is.dev) {
            installExtension([REDUX_DEVTOOLS, REACT_DEVELOPER_TOOLS])
                .then(() => {
                    // console.log(`Added Extensions:  ${redux.name}, ${react.name}`)
                })
                .catch(() => {
                    // console.log("An error occurred: ", err)
                });
        }
        // デバッグの際はデベロッパーツールを開く
        if (!app.isPackaged) {
            mainWindow.webContents.openDevTools({ mode: "detach" });
        }
    });

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
}
