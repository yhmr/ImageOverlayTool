import path from "path";
import { BrowserWindow, globalShortcut } from "electron";
import { is } from "@electron-toolkit/utils";
import { IConfigRepository } from "../repositories/ConfigRepository";

/**
 * ウィンドウ管理クラス
 * メインウィンドウと画像設定ウィンドウの作成・管理を行う
 */
export class WindowManager {
    private mainWindow: BrowserWindow | null = null;
    private imageSettingsWindow: BrowserWindow | null = null;
    private configRepository: IConfigRepository;
    private isQuitting = false;
    private pendingFilePath: string | null = null;

    constructor(configRepository: IConfigRepository) {
        this.configRepository = configRepository;
    }

    /**
     * アプリ終了シーケンスを開始
     */
    willQuit(): void {
        this.isQuitting = true;
    }

    /**
     * 指定されたファイルを開く
     */
    openFile(filePath: string): void {
        const ext = path.extname(filePath).toLowerCase();

        // ウィンドウが準備完了していれば送信、そうでなければ保留
        if (this.mainWindow && !this.mainWindow.isDestroyed() && this.mainWindow.isVisible()) {
            this.mainWindow.webContents.send("file:open", { filePath, ext });
        } else {
            this.pendingFilePath = filePath;
        }
    }

    /**
     * メインウィンドウを作成
     */
    createMainWindow(): BrowserWindow {
        const { pos, size } = this.configRepository.getWindowPositionAndSize();

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

        const flushPending = () => {
            if (this.pendingFilePath) {
                const filePath = this.pendingFilePath;
                this.pendingFilePath = null;
                this.openFile(filePath);
            }
        };

        // 準備が出来た時点で表示
        this.mainWindow.on("ready-to-show", () => {
            this.mainWindow?.show();
            // show() calls flushPending via 'show' event listener below
        });

        this.mainWindow.on("show", flushPending);
        this.mainWindow.on("focus", flushPending);

        // ウィンドウが閉じられる際にウィンドウ設定を保存
        this.mainWindow.on("close", () => {
            if (this.mainWindow) {
                this.configRepository.saveWindowPositionAndSize(
                    this.mainWindow.getPosition(),
                    this.mainWindow.getSize()
                );
            }
        });

        // ウィンドウが閉じられた際の処理
        this.mainWindow.on("closed", () => {
            // メインウィンドウが閉じられたらアプリ終了とみなす
            this.isQuitting = true;

            // 画像設定ウィンドウも閉じる
            if (this.imageSettingsWindow && !this.imageSettingsWindow.isDestroyed()) {
                this.imageSettingsWindow.close();
            }
            this.mainWindow = null;
        });

        // コンテンツをロード
        if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
            this.mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"] + "/main-window/");
        } else {
            this.mainWindow.loadFile(
                path.join(__dirname, "../renderer/main-window/index.html")
            );
        }

        return this.mainWindow;
    }

    /**
     * 画像設定ウィンドウを作成
     */
    createImageSettingsWindow(): BrowserWindow {
        if (this.imageSettingsWindow && !this.imageSettingsWindow.isDestroyed()) {
            this.imageSettingsWindow.focus();
            return this.imageSettingsWindow;
        }

        const { pos, size } = this.configRepository.getImageSettingsWindowPositionAndSize();

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
                this.configRepository.saveImageSettingsWindowPositionAndSize(
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

        return this.imageSettingsWindow;
    }

    /**
     * 画像設定ウィンドウの表示/非表示をトグル
     */
    toggleImageSettingsWindow(): boolean {
        if (!this.imageSettingsWindow || this.imageSettingsWindow.isDestroyed()) {
            this.createImageSettingsWindow();
            return true;
        }

        if (this.imageSettingsWindow.isVisible()) {
            this.configRepository.saveImageSettingsWindowPositionAndSize(
                this.imageSettingsWindow.getPosition(),
                this.imageSettingsWindow.getSize()
            );
            this.imageSettingsWindow.hide();
            return false;
        } else {
            this.imageSettingsWindow.show();
            this.imageSettingsWindow.focus();
            return true;
        }
    }

    /**
     * グローバルショートカットを登録
     */
    registerShortcuts(): void {
        globalShortcut.register("CommandOrControl+I", () => {
            this.toggleImageSettingsWindow();
        });
    }

    /**
     * グローバルショートカットを解除
     */
    unregisterShortcuts(): void {
        globalShortcut.unregisterAll();
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
        if (this.imageSettingsWindow && !this.imageSettingsWindow.isDestroyed()) {
            windows.push(this.imageSettingsWindow);
        }
        return windows;
    }

    /**
     * すべてのウィンドウを閉じる
     */
    closeAllWindows(): void {
        // 画像設定ウィンドウを強制的に閉じる（closeイベントをバイパス）
        if (this.imageSettingsWindow && !this.imageSettingsWindow.isDestroyed()) {
            this.imageSettingsWindow.destroy();
            this.imageSettingsWindow = null;
        }

        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.close();
        }
    }

    /**
     * アプリ終了時のクリーンアップ
     */
    cleanup(): void {
        this.unregisterShortcuts();
        this.closeAllWindows();
    }
}
