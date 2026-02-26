import path from "path";
import { BrowserWindow, dialog, shell } from "electron";
import { is, platform } from "@electron-toolkit/utils";
import { IWindowRepository } from "../repositories/WindowRepository";
import log from "../logger";
import { tUnsavedChanges } from "../../i18n/mainI18n";
import { SplashLifecycle } from "./splashLifecycle";

interface MainWindowLifecycleOptions {
    windowRepository: IWindowRepository;
    splashLifecycle: SplashLifecycle;
    isQuitting: () => boolean;
    isProjectDirty: () => boolean;
    onWindowActivated: () => void;
    onMainWindowClosed: () => void;
}

/**
 * メインウィンドウの生成・イベント登録・破棄を管理する
 */
export class MainWindowLifecycle {
    private mainWindow: BrowserWindow | null = null;

    constructor(private readonly options: MainWindowLifecycleOptions) {}

    /**
     * メインウィンドウを作成してライフサイクルイベントを結びつける
     */
    createMainWindow(): BrowserWindow {
        log.debug("Creating main window...");
        const { pos, size, isMaximized } =
            this.options.windowRepository.getWindowPositionAndSize();

        this.mainWindow = new BrowserWindow({
            show: false,
            width: size.width,
            height: size.height,
            x: pos.x,
            y: pos.y,
            transparent: true,
            frame: false,
            resizable: true,
            ...(platform.isMacOS ? { titleBarStyle: "hidden" as const } : {}),
            ...(platform.isWindows ? { thickFrame: true } : {}),
            webPreferences: {
                preload: path.join(__dirname, "../preload/index.js"),
                contextIsolation: true,
                nodeIntegration: false,
                sandbox: true,
                webSecurity: true,
            },
        });

        this.mainWindow.webContents.setWindowOpenHandler((details) => {
            if (
                details.url.startsWith("https:") ||
                details.url.startsWith("http:")
            ) {
                // 外部リンクはOS既定ブラウザで開く
                shell.openExternal(details.url);
                return { action: "deny" };
            }
            return { action: "allow" };
        });

        this.mainWindow.on("ready-to-show", () => {
            log.debug("Main window ready-to-show");
            // スプラッシュなし（E2E等）の場合は即表示
            if (!this.options.splashLifecycle.getWindow()) {
                if (isMaximized) {
                    this.mainWindow?.maximize();
                    this.mainWindow?.setResizable(true);
                }
                this.mainWindow?.show();
                return;
            }

            // スプラッシュ最低表示時間を満たしてから表示する
            const delay = this.options.splashLifecycle.getRemainingDelay();
            log.debug(`Splash remaining delay=${delay}ms`);
            setTimeout(() => {
                if (isMaximized) {
                    this.mainWindow?.maximize();
                    this.mainWindow?.setResizable(true);
                }
                this.mainWindow?.show();
                this.options.splashLifecycle.destroy();
            }, delay);
        });

        this.mainWindow.on("show", () => this.options.onWindowActivated());
        this.mainWindow.on("focus", () => this.options.onWindowActivated());

        this.mainWindow.on("close", (event) => {
            if (!this.mainWindow) {
                return;
            }

            // 未保存変更がある場合は確認ダイアログを優先
            if (!this.options.isQuitting() && this.options.isProjectDirty()) {
                const selected = dialog.showMessageBoxSync(this.mainWindow, {
                    type: "warning",
                    buttons: [
                        tUnsavedChanges("button_cancel"),
                        tUnsavedChanges("button_discard_exit"),
                    ],
                    defaultId: 0,
                    cancelId: 0,
                    title: tUnsavedChanges("title"),
                    message: tUnsavedChanges("confirm_exit"),
                });

                if (selected === 0) {
                    event.preventDefault();
                    return;
                }
            }

            // 終了前にウィンドウ位置/サイズを保存する
            const currentlyMaximized = this.mainWindow.isMaximized();
            if (currentlyMaximized) {
                const bounds = this.mainWindow.getNormalBounds();
                this.options.windowRepository.saveWindowPositionAndSize(
                    [bounds.x, bounds.y],
                    [bounds.width, bounds.height],
                    true
                );
                return;
            }

            this.options.windowRepository.saveWindowPositionAndSize(
                this.mainWindow.getPosition(),
                this.mainWindow.getSize(),
                false
            );
        });

        this.mainWindow.on("closed", () => {
            this.options.onMainWindowClosed();
            this.mainWindow = null;
        });

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
     * 現在のメインウィンドウを取得
     */
    getMainWindow(): BrowserWindow | null {
        return this.mainWindow;
    }

    /**
     * メインウィンドウを通常終了経路で閉じる
     */
    closeMainWindow(): void {
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.close();
        }
    }

    /**
     * 有効なメインウィンドウの配列を返す
     */
    getAllWindows(): BrowserWindow[] {
        const windows: BrowserWindow[] = [];
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            windows.push(this.mainWindow);
        }
        return windows;
    }
}
