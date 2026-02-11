import path from "path";
import { BrowserWindow, shell, app } from "electron";
import { is } from "@electron-toolkit/utils";
import { IWindowRepository } from "../repositories/WindowRepository";
import log from "../logger";
import {
    ElectronWindowShortcutManager,
    type IWindowShortcutManager,
} from "./windowShortcutManager";
import { IPC_EVENTS } from "../../shared/ipc/channels";

export interface IMainWindowProvider {
    getMainWindow(): BrowserWindow | null;
}

export interface IWindowCollectionProvider {
    getAllWindows(): BrowserWindow[];
}

export interface IImageSettingsWindowController {
    toggleImageSettingsWindow(): boolean;
}
/**
 * ウィンドウ管理クラス
 * メインウィンドウと画像設定ウィンドウの作成・管理を行う
 */
export class WindowManager {
    private mainWindow: BrowserWindow | null = null;
    private splashWindow: BrowserWindow | null = null;
    private imageSettingsWindow: BrowserWindow | null = null;
    private windowRepository: IWindowRepository;
    private readonly shortcutManager: IWindowShortcutManager;
    private isQuitting = false;
    private pendingFilePath: string | null = null;
    private splashDisplayTime: number | null = null; // スプラッシュ表示開始時刻

    constructor(
        windowRepository: IWindowRepository,
        shortcutManager: IWindowShortcutManager = new ElectronWindowShortcutManager()
    ) {
        this.windowRepository = windowRepository;
        this.shortcutManager = shortcutManager;
    }

    /**
     * アプリ終了シーケンスを開始
     */
    willQuit(): void {
        this.isQuitting = true;
    }

    /**
     * スプラッシュ画面を表示（完了まで待機）
     */
    async showSplashScreen(): Promise<BrowserWindow> {
        log.debug("Creating splash window...");
        this.splashWindow = new BrowserWindow({
            width: 500,
            height: 300,
            transparent: true,
            frame: false,
            alwaysOnTop: true,
            resizable: false,
            movable: false,
            center: true,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
            },
        });

        const showPromise = new Promise<BrowserWindow>((resolve) => {
            this.splashWindow?.once("ready-to-show", () => {
                this.splashWindow?.show();
                this.splashDisplayTime = Date.now(); // 表示時刻を記録
                log.info("Splash window shown");
                resolve(this.splashWindow!);
            });
        });

        if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
            this.splashWindow.loadURL(
                process.env["ELECTRON_RENDERER_URL"] + "/splash/"
            );
        } else {
            this.splashWindow.loadFile(
                path.join(__dirname, "../renderer/splash/index.html")
            );
        }

        return showPromise;
    }

    /**
     * スプラッシュウィンドウを破棄
     */
    destroySplashWindow(): void {
        if (this.splashWindow && !this.splashWindow.isDestroyed()) {
            log.debug("Destroying splash window...");
            this.splashWindow.destroy();
            this.splashWindow = null;
        }
    }

    /**
     * 指定されたファイルを開く
     */
    openFile(filePath: string): void {
        log.debug(`Opening file: ${filePath}`);
        const ext = path.extname(filePath).toLowerCase();

        // ウィンドウが準備完了していれば送信、そうでなければ保留
        if (
            this.mainWindow &&
            !this.mainWindow.isDestroyed() &&
            this.mainWindow.isVisible()
        ) {
            log.info(`Sending file to renderer: ${filePath}`);
            this.mainWindow.webContents.send(IPC_EVENTS.fileOpen, {
                filePath,
                ext,
            });
        } else {
            log.debug(`Window not ready, pending file: ${filePath}`);
            this.pendingFilePath = filePath;
        }
    }

    /**
     * メインウィンドウを作成
     */
    createMainWindow(): BrowserWindow {
        log.debug("Creating main window...");
        const { pos, size } = this.windowRepository.getWindowPositionAndSize();

        this.mainWindow = new BrowserWindow({
            show: false,
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

        // リンクを開いた際に、標準ブラウザを開くための設定
        this.mainWindow.webContents.setWindowOpenHandler((details) => {
            if (
                details.url.startsWith("https:") ||
                details.url.startsWith("http:")
            ) {
                shell.openExternal(details.url);
                return { action: "deny" };
            }
            return { action: "allow" };
        });

        const flushPending = () => {
            if (this.pendingFilePath) {
                const filePath = this.pendingFilePath;
                this.pendingFilePath = null;
                this.openFile(filePath);
            }
        };

        // 準備が出来た時点で表示
        this.mainWindow.on("ready-to-show", () => {
            log.debug("Main window ready-to-show");

            // スプラッシュ画面がない場合（E2E等）は即座に表示
            if (!this.splashWindow) {
                this.mainWindow?.show();
                return;
            }

            // スプラッシュ画面を最低でも一定時間は表示し続ける
            const MINIMUM_SPLASH_DURATION = 1500; // 1.5秒
            const elapsed = Date.now() - (this.splashDisplayTime || Date.now());
            const delay = Math.max(0, MINIMUM_SPLASH_DURATION - elapsed);

            log.debug(
                `Splash duration: elapsed=${elapsed}ms, delay=${delay}ms`
            );

            setTimeout(() => {
                this.mainWindow?.show();
                this.destroySplashWindow();
            }, delay);

            // show() calls flushPending via 'show' event listener below
        });

        this.mainWindow.on("show", flushPending);
        this.mainWindow.on("focus", flushPending);

        // ウィンドウが閉じられる際にウィンドウ設定を保存
        this.mainWindow.on("close", () => {
            if (this.mainWindow) {
                this.windowRepository.saveWindowPositionAndSize(
                    this.mainWindow.getPosition(),
                    this.mainWindow.getSize()
                );
            }
        });

        // ウィンドウが閉じられた際の処理
        this.mainWindow.on("closed", () => {
            // メインウィンドウが閉じられたらアプリ終了とみなす
            this.isQuitting = true;
            this.destroySplashWindow();

            // 画像設定ウィンドウも閉じる
            if (
                this.imageSettingsWindow &&
                !this.imageSettingsWindow.isDestroyed()
            ) {
                this.imageSettingsWindow.close();
            }
            this.mainWindow = null;
        });

        // コンテンツをロード
        if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
            this.mainWindow.loadURL(
                process.env["ELECTRON_RENDERER_URL"] + "/main-window/"
            );
        } else {
            this.mainWindow.loadFile(
                path.join(__dirname, "../renderer/main-window/index.html")
            );
        }
        log.info("Main window created");
        return this.mainWindow;
    }

    /**
     * 画像設定ウィンドウを作成
     */
    createImageSettingsWindow(): BrowserWindow {
        if (
            this.imageSettingsWindow &&
            !this.imageSettingsWindow.isDestroyed()
        ) {
            log.debug("Image settings window already exists, focusing");
            this.imageSettingsWindow.focus();
            return this.imageSettingsWindow;
        }

        log.debug("Creating image settings window...");

        const { pos, size } =
            this.windowRepository.getImageSettingsWindowPositionAndSize();

        this.imageSettingsWindow = new BrowserWindow({
            show: false,
            width: size.width,
            height: size.height,
            x: pos.x,
            y: pos.y,
            parent: this.mainWindow ?? undefined,
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
        this.imageSettingsWindow.on("ready-to-show", () => {
            this.imageSettingsWindow?.show();
        });

        // ウィンドウが閉じられる際に設定を保存
        this.imageSettingsWindow.on("close", (event) => {
            if (this.imageSettingsWindow) {
                this.windowRepository.saveImageSettingsWindowPositionAndSize(
                    this.imageSettingsWindow.getPosition(),
                    this.imageSettingsWindow.getSize()
                );
            }

            // アプリ終了時はイベントをキャンセルしない（ウィンドウを閉じる）
            if (this.isQuitting) {
                return;
            }

            // トグル動作: 実際には閉じずに非表示にする
            event.preventDefault();
            if (this.imageSettingsWindow) {
                this.imageSettingsWindow.hide();
            }
        });

        // コンテンツをロード
        if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
            this.imageSettingsWindow.loadURL(
                process.env["ELECTRON_RENDERER_URL"] + "/image-settings/"
            );
        } else {
            this.imageSettingsWindow.loadFile(
                path.join(__dirname, "../renderer/image-settings/index.html")
            );
        }
        log.info("Image settings window created");
        return this.imageSettingsWindow;
    }

    /**
     * 画像設定ウィンドウの表示/非表示をトグル
     */
    toggleImageSettingsWindow(): boolean {
        if (
            !this.imageSettingsWindow ||
            this.imageSettingsWindow.isDestroyed()
        ) {
            log.debug("Image settings window not found, creating new one");
            this.createImageSettingsWindow();
            return true;
        }

        if (this.imageSettingsWindow.isVisible()) {
            log.debug("Hiding image settings window");
            this.windowRepository.saveImageSettingsWindowPositionAndSize(
                this.imageSettingsWindow.getPosition(),
                this.imageSettingsWindow.getSize()
            );
            this.imageSettingsWindow.hide();
            return false;
        } else {
            log.debug("Showing image settings window");
            this.imageSettingsWindow.show();
            this.imageSettingsWindow.focus();
            return true;
        }
    }

    /**
     * グローバルショートカットを登録
     */
    registerShortcuts(): void {
        this.shortcutManager.registerToggleImageSettings(() => {
            this.toggleImageSettingsWindow();
        });
    }

    /**
     * グローバルショートカットを解除
     */
    unregisterShortcuts(): void {
        this.shortcutManager.unregisterAll();
    }

    /**
     * メインウィンドウを取得
     */
    getMainWindow(): BrowserWindow | null {
        return this.mainWindow;
    }

    /**
     * 画像設定ウィンドウを取得
     */
    getImageSettingsWindow(): BrowserWindow | null {
        return this.imageSettingsWindow;
    }

    /**
     * すべての有効なウィンドウを取得
     */
    getAllWindows(): BrowserWindow[] {
        const windows: BrowserWindow[] = [];
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            windows.push(this.mainWindow);
        }
        if (
            this.imageSettingsWindow &&
            !this.imageSettingsWindow.isDestroyed()
        ) {
            windows.push(this.imageSettingsWindow);
        }
        if (this.splashWindow && !this.splashWindow.isDestroyed()) {
            windows.push(this.splashWindow);
        }
        return windows;
    }

    /**
     * すべてのウィンドウを閉じる
     */
    closeAllWindows(): void {
        // 画像設定ウィンドウを強制的に閉じる（closeイベントをバイパス）
        if (
            this.imageSettingsWindow &&
            !this.imageSettingsWindow.isDestroyed()
        ) {
            this.imageSettingsWindow.destroy();
            this.imageSettingsWindow = null;
        }

        this.destroySplashWindow();

        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.close();
        }
    }

    /**
     * アプリ終了時のクリーンアップ
     */
    cleanup(): void {
        log.debug("WindowManager cleanup started");
        this.unregisterShortcuts();
        this.closeAllWindows();
        log.debug("WindowManager cleanup completed");
    }

    /**
     * DevToolsを開く（開発環境かつプレビューでない場合のみ）
     */
    openDevTools(window: BrowserWindow, e2eEnabled: boolean): void {
        const shouldOpen =
            !app.isPackaged &&
            is.dev &&
            process.env["ELECTRON_RENDERER_URL"] &&
            !e2eEnabled;

        if (shouldOpen) {
            window.webContents.openDevTools({ mode: "detach" });
        }
    }
}
