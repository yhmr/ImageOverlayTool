import path from "path";
import {
  BrowserWindow,
  app,
  Menu,
  ipcMain,
  dialog,
  screen,
  protocol,
  net,
} from "electron";
import {
  installExtension,
  REDUX_DEVTOOLS,
  REACT_DEVELOPER_TOOLS,
} from "electron-devtools-installer";
import { pathToFileURL } from "url";
import { join } from "path";
import { is } from "@electron-toolkit/utils"; // electron-viteプロジェクトでよく使われるユーティリティ
import Store from "electron-store";
import { SettingType } from "../preload/index";
import { calcCenterPosition } from "../utils/calcCenterPosition";

let mainWindow: BrowserWindow;
// 設定ファイル
interface StoreType {
  window: {
    pos: Array<number>;
    size: Array<number>;
    color: string;
  };
  setting: {
    language: string;
    unit_factor: number;
  };
}
const store = new Store<StoreType>({
  cwd: app.getPath("userData"), // 保存先のディレクトリ
  name: "config", // ファイル名
  fileExtension: "json", // 拡張子
});
// ウィンドウのデフォルトサイズ
const DEFAULT_SIZE = {
  width: 800,
  height: 600,
};

// Menu削除
Menu.setApplicationMenu(null);

app.whenReady().then(() => {
  // ウィンドウの設定読み込み or 初期化
  const pos = store.get("window.pos", getDefaultCenterPosition());
  const size = store.get("window.size", [
    DEFAULT_SIZE.width,
    DEFAULT_SIZE.height,
  ]);

  mainWindow = new BrowserWindow({
    width: size[0],
    height: size[1],
    x: pos[0],
    y: pos[1],
    titleBarStyle: "hidden",
    transparent: true,
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true,
    },
  });

  // 画像ロード用に'local-file' というカスタムプロトコルを登録
  protocol.handle("local-file", (request) => {
    // URLからパス部分を取り出し、ファイルURLに変換して返す
    const filePath = request.url.replace("local-file://", "");
    return net.fetch(pathToFileURL(decodeURIComponent(filePath)).toString());
  });

  // 開発時はViteの開発サーバーURL、本番はビルドされたHTMLファイルをロード
  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }

  if (is.dev) {
    installExtension([REDUX_DEVTOOLS, REACT_DEVELOPER_TOOLS])
      .then(([redux, react]) =>
        console.log(`Added Extensions:  ${redux.name}, ${react.name}`)
      )
      .catch((err) => console.log("An error occurred: ", err));
  }

  // 閉じる
  mainWindow.on("close", () => {
    // ウィンドウ設定を保存
    store.set("window.pos", mainWindow.getPosition());
    store.set("window.size", mainWindow.getSize());
  });
  mainWindow.on("closed", () => {
    mainWindow.destroy();
  });

  // デバッグの際はデベロッパーツールを開く
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools({ mode: "detach" });
  }
});

app.once("window-all-closed", () => app.quit());

/**
 * ウィンドウの中央の座標を返却
 */
function getDefaultCenterPosition() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  return calcCenterPosition(
    { width, height },
    { width: DEFAULT_SIZE.width, height: DEFAULT_SIZE.height }
  );
}

/**
 * [IPC] 指定ファイルの内容を返却
 */
ipcMain.handle("dialog:openFile", async () => {
  // ファイルを選択
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    buttonLabel: "Open", // 確認ボタンのラベル
    filters: [{ name: "Text", extensions: ["jpg", "jpeg", "png"] }],
    properties: [
      "openFile", // ファイルの選択を許可
      "createDirectory", // ディレクトリの作成を許可 (macOS)
    ],
  });

  if (canceled) {
    return;
  } else {
    return filePaths[0];
  }
});

/**
 * [IPC] Windowサイズを切り替え
 */
ipcMain.handle("window:switchSize", async () => {
  if (!mainWindow.isMaximized()) {
    mainWindow.maximize();
    return true;
  } else {
    mainWindow.unmaximize();
    return false;
  }
});

/**
 * [IPC] Windowを閉じる
 */
ipcMain.handle("window:close", async () => {
  app.quit();
});

/**
 * [IPC] 設定の読み込み
 */
ipcMain.handle("setting:load", async () => {
  return {
    language: store.get("setting.language", "en"),
    unit_factor: store.get("setting.unit_factor", 1),
  };
});

/**
 * [IPC] 設定の保存
 */
ipcMain.handle("setting:save", async (event, arg: SettingType) => {
  if (arg.language !== undefined) {
    store.set("setting.language", arg.language);
  }
  if (typeof arg.unit_factor === "number") {
    store.set("setting.unit_factor", arg.unit_factor);
  }
});

/**
 * [IPC] ウィンドウ色の読み込み
 */
ipcMain.handle("window_color:load", async () => {
  return store.get("window.color", "#FFFFFF55");
});

/**
 * [IPC] ウィンドウ色の保存
 */
ipcMain.handle("window_color:save", async (event, color: string) => {
  store.set("window.color", color);
});
