import { app, Menu } from "electron";
import {
  installExtension,
  REDUX_DEVTOOLS,
  REACT_DEVELOPER_TOOLS,
} from "electron-devtools-installer";
import { is } from "@electron-toolkit/utils";

import { registerWindowHandlers } from "./ipc/window";
import { registerAppConfigHandlers } from "./ipc/appConfig";
import {
  registerLocalResourceProtocol,
  setupProtocolHandler,
} from "./ipc/protocol";
import { registerProjectHandlers } from "./ipc/project";
import { registerImageSettingsWindowHandlers } from "./ipc/imageSettingsWindow";

import { ConfigRepositoryFactory } from "./repositories/ConfigRepositoryFactory";
import { ProjectRepositoryFactory } from "./repositories/ProjectRepositoryFactory";
import { WindowManager } from "./windows/windowManager";

// 開発中のみ、外部からのデバッグ接続(9222)を許可する
if (!app.isPackaged) {
  app.commandLine.appendSwitch("remote-debugging-port", "9222");
}

// 設定ファイル
const configRepository = ConfigRepositoryFactory.create();
// プロジェクトファイル
const projectRepository = ProjectRepositoryFactory.create();
// ウィンドウマネージャー
const windowManager = new WindowManager(configRepository);

// Menu削除
Menu.setApplicationMenu(null);

// プロトコルを事前登録
registerLocalResourceProtocol();

app.whenReady().then(() => {
  // プロトコルハンドラ登録
  setupProtocolHandler();

  // メインウィンドウを作成
  const mainWindow = windowManager.createMainWindow();

  // IPCハンドラ登録
  registerWindowHandlers(mainWindow);
  registerAppConfigHandlers(mainWindow, configRepository);
  registerProjectHandlers(mainWindow, projectRepository);
  registerImageSettingsWindowHandlers(windowManager);

  // グローバルショートカットを登録
  windowManager.registerShortcuts();

  // 開発時はデベロッパーツールを開く
  if (is.dev) {
    installExtension([REDUX_DEVTOOLS, REACT_DEVELOPER_TOOLS])
      .then(([redux, react]) =>
        console.log(`Added Extensions:  ${redux.name}, ${react.name}`)
      )
      .catch((err) => console.log("An error occurred: ", err));
  }
  // デバッグの際はデベロッパーツールを開く
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools({ mode: "detach" });
  }
});

// アプリケーションが閉じられた際の処理
app.once("window-all-closed", () => {
  windowManager.cleanup();
  app.quit();
});

// アプリ終了処理開始時 (Cmd+Qなど)
app.on("before-quit", () => {
  windowManager.willQuit();
});
