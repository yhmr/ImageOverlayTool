import path from "path";
import { BrowserWindow, app, Menu } from "electron";
import {
  installExtension,
  REDUX_DEVTOOLS,
  REACT_DEVELOPER_TOOLS,
} from "electron-devtools-installer";
import { join } from "path";
import { is } from "@electron-toolkit/utils";

import { registerWindowHandlers } from "./ipc/window";
import { registerAppConfigHandlers } from "./ipc/appConfig";
import {
  registerLocalResourceProtocol,
  setupProtocolHandler,
} from "./ipc/protocol";
import { ConfigRepositoryFactory } from "./repositories/ConfigRepositoryFactory";

// 開発中のみ、外部からのデバッグ接続(9222)を許可する
if (!app.isPackaged) {
  app.commandLine.appendSwitch("remote-debugging-port", "9222");
}

let mainWindow: BrowserWindow;

// 設定ファイル
const configRepository = ConfigRepositoryFactory.create();

// Menu削除
Menu.setApplicationMenu(null);

// プロトコルを事前登録
registerLocalResourceProtocol();

app.whenReady().then(() => {
  // ウィンドウの設定読み込み or 初期化
  const { pos, size } = configRepository.getWindowPositionAndSize();

  mainWindow = new BrowserWindow({
    show: false, // 初めは非表示
    width: size.width,
    height: size.height,
    x: pos.x,
    y: pos.y,
    titleBarStyle: "hidden",
    transparent: true,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true,
    },
  });

  // 準備が出来た時点で表示
  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });

  setupProtocolHandler();

  // 開発時はViteの開発サーバーURL、本番はビルドされたHTMLファイルをロード
  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
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

  // ウィンドウが閉じられた際の処理
  mainWindow.on("close", () => {
    // ウィンドウ設定を保存
    configRepository.saveWindowPositionAndSize(
      mainWindow.getPosition(),
      mainWindow.getSize()
    );
  });
  mainWindow.on("closed", () => {
    mainWindow.destroy();
  });

  // IPCハンドラ登録
  registerWindowHandlers(mainWindow);
  registerAppConfigHandlers(mainWindow, configRepository);
});

// アプリケーションが閉じられた際の処理
app.once("window-all-closed", () => app.quit());
