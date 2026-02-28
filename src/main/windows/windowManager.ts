import path from "path";
import { BrowserWindow, app } from "electron";
import { is } from "@electron-toolkit/utils";
import { IWindowRepository } from "../repositories/WindowRepository";
import log from "../logger";
import type { AppControlCommand } from "../../shared/types/AppControlCommand";
import type { LaunchIntent } from "../../shared/types/LaunchIntent";
import {
    ElectronWindowShortcutManager,
    type IWindowShortcutManager,
} from "./windowShortcutManager";
import { SplashLifecycle } from "./splashLifecycle";
import { ShortcutCoordinator } from "./shortcutCoordinator";
import { MainWindowLifecycle } from "./mainWindowLifecycle";
import { SettingsWindowController } from "./settingsWindowController";
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

export interface IDimensionSettingsWindowController {
    toggleDimensionSettingsWindow(): boolean;
}

export interface IProjectDirtyStateController {
    setProjectDirty(isDirty: boolean): void;
}

/**
 * ウィンドウ管理クラス
 * 各ライフサイクルコンポーネントを合成してオーケストレーションする
 */
export class WindowManager {
    private readonly shortcutCoordinator: ShortcutCoordinator;
    private readonly splashLifecycle: SplashLifecycle;
    private readonly mainWindowLifecycle: MainWindowLifecycle;
    private readonly settingsWindowController: SettingsWindowController;
    private isQuitting = false;
    private isProjectDirty = false;
    private pendingFilePath: string | null = null;
    private pendingLaunchIntent: LaunchIntent | null = null;
    private pendingAppControlCommand: AppControlCommand | null = null;

    constructor(
        windowRepository: IWindowRepository,
        shortcutManager: IWindowShortcutManager = new ElectronWindowShortcutManager()
    ) {
        this.shortcutCoordinator = new ShortcutCoordinator(shortcutManager);
        this.splashLifecycle = new SplashLifecycle();
        this.mainWindowLifecycle = new MainWindowLifecycle({
            windowRepository,
            splashLifecycle: this.splashLifecycle,
            isQuitting: () => this.isQuitting,
            isProjectDirty: () => this.isProjectDirty,
            onWindowActivated: () => this.flushPendingFileOpen(),
            onMainWindowClosed: () => {
                this.isQuitting = true;
                this.destroySplashWindow();
                this.settingsWindowController.closeSettingsWindows();
            },
        });
        this.settingsWindowController = new SettingsWindowController({
            windowRepository,
            getMainWindow: () => this.mainWindowLifecycle.getMainWindow(),
            isQuitting: () => this.isQuitting,
            resetDimensionInteractionState: () =>
                this.resetDimensionInteractionState(),
        });
    }

    /**
     * メインウィンドウが表示可能になった後に保留中ファイルを通知する
     */
    private flushPendingFileOpen(): void {
        if (this.pendingFilePath) {
            const filePath = this.pendingFilePath;
            this.pendingFilePath = null;
            this.openFile(filePath);
        }

        if (this.pendingLaunchIntent) {
            const launchIntent = this.pendingLaunchIntent;
            this.pendingLaunchIntent = null;
            this.applyLaunchIntent(launchIntent);
        }

        if (this.pendingAppControlCommand) {
            const command = this.pendingAppControlCommand;
            this.pendingAppControlCommand = null;
            this.applyAppControlCommand(command);
        }
    }

    private notifyClickThroughShortcutTriggered(): void {
        const mainWindow = this.mainWindowLifecycle.getMainWindow();
        if (!mainWindow || mainWindow.isDestroyed()) {
            return;
        }
        mainWindow.webContents.send(IPC_EVENTS.clickThroughShortcutTriggered);
    }

    private notifyAlwaysOnTopShortcutTriggered(): void {
        const mainWindow = this.mainWindowLifecycle.getMainWindow();
        if (!mainWindow || mainWindow.isDestroyed()) {
            return;
        }
        mainWindow.webContents.send(IPC_EVENTS.alwaysOnTopShortcutTriggered);
    }

    private resetDimensionInteractionState(): void {
        const windows = this.getAllWindows();
        windows.forEach((win) => {
            win.webContents.send(IPC_EVENTS.interactionModeUpdated, "default");
        });
    }

    /**
     * アプリ終了シーケンス開始フラグを立てる
     */
    willQuit(): void {
        this.isQuitting = true;
    }

    /**
     * 未保存変更フラグを更新する
     */
    setProjectDirty(isDirty: boolean): void {
        this.isProjectDirty = isDirty;
    }

    /**
     * スプラッシュ付きでメインウィンドウを起動する
     * skipSplash=true の場合はスプラッシュをスキップ
     */
    async launchMainWindow(
        options: { skipSplash: boolean } = { skipSplash: false }
    ): Promise<BrowserWindow> {
        if (!options.skipSplash) {
            await this.showSplashScreen();
        }
        return this.createMainWindow();
    }

    private async showSplashScreen(): Promise<BrowserWindow> {
        return this.splashLifecycle.show();
    }

    /**
     * スプラッシュウィンドウを破棄
     */
    destroySplashWindow(): void {
        this.splashLifecycle.destroy();
    }

    /**
     * 指定されたファイルを renderer へ通知する
     * メインウィンドウ未準備時は pending として保持する
     */
    openFile(filePath: string): void {
        log.debug(`Opening file: ${filePath}`);
        const ext = path.extname(filePath).toLowerCase();
        const mainWindow = this.mainWindowLifecycle.getMainWindow();

        if (mainWindow && !mainWindow.isDestroyed() && mainWindow.isVisible()) {
            log.info(`Sending file to renderer: ${filePath}`);
            mainWindow.webContents.send(IPC_EVENTS.fileOpen, {
                filePath,
                ext,
            });
            return;
        }

        log.debug(`Window not ready, pending file: ${filePath}`);
        this.pendingFilePath = filePath;
    }

    applyLaunchIntent(launchIntent: LaunchIntent): void {
        log.debug("Applying launch intent.");
        const mainWindow = this.mainWindowLifecycle.getMainWindow();

        if (mainWindow && !mainWindow.isDestroyed() && mainWindow.isVisible()) {
            mainWindow.webContents.send(
                IPC_EVENTS.launchIntentApply,
                launchIntent
            );
            return;
        }

        log.debug("Window not ready, pending launch intent.");
        this.pendingLaunchIntent = launchIntent;
    }

    applyAppControlCommand(command: AppControlCommand): void {
        log.debug("Applying app control command.");
        const mainWindow = this.mainWindowLifecycle.getMainWindow();

        if (mainWindow && !mainWindow.isDestroyed() && mainWindow.isVisible()) {
            mainWindow.webContents.send(
                IPC_EVENTS.appControlCommandApply,
                command
            );
            return;
        }

        log.debug("Window not ready, pending app control command.");
        this.pendingAppControlCommand = command;
    }

    /**
     * メインウィンドウを作成
     */
    createMainWindow(): BrowserWindow {
        return this.mainWindowLifecycle.createMainWindow();
    }

    /**
     * 画像設定ウィンドウを作成
     */
    createImageSettingsWindow(): BrowserWindow {
        return this.settingsWindowController.createImageSettingsWindow();
    }

    /**
     * 寸法線設定ウィンドウを作成
     */
    createDimensionSettingsWindow(): BrowserWindow {
        return this.settingsWindowController.createDimensionSettingsWindow();
    }

    /**
     * 画像設定ウィンドウの表示/非表示をトグル
     */
    toggleImageSettingsWindow(): boolean {
        return this.settingsWindowController.toggleImageSettingsWindow();
    }

    /**
     * 寸法線設定ウィンドウの表示/非表示をトグル
     */
    toggleDimensionSettingsWindow(): boolean {
        return this.settingsWindowController.toggleDimensionSettingsWindow();
    }

    /**
     * グローバルショートカットを登録
     */
    registerShortcuts(): void {
        this.shortcutCoordinator.register({
            onAlwaysOnTopToggle: () => {
                this.notifyAlwaysOnTopShortcutTriggered();
            },
            onClickThroughToggle: () => {
                this.notifyClickThroughShortcutTriggered();
            },
        });
    }

    /**
     * グローバルショートカットを解除
     */
    unregisterShortcuts(): void {
        this.shortcutCoordinator.unregisterAll();
    }

    /**
     * メインウィンドウを取得
     */
    getMainWindow(): BrowserWindow | null {
        return this.mainWindowLifecycle.getMainWindow();
    }

    /**
     * 画像設定ウィンドウを取得
     */
    getImageSettingsWindow(): BrowserWindow | null {
        return this.settingsWindowController.getImageSettingsWindow();
    }

    /**
     * 寸法線設定ウィンドウを取得
     */
    getDimensionSettingsWindow(): BrowserWindow | null {
        return this.settingsWindowController.getDimensionSettingsWindow();
    }

    /**
     * すべての有効なウィンドウを取得
     */
    getAllWindows(): BrowserWindow[] {
        const windows = [
            ...this.mainWindowLifecycle.getAllWindows(),
            ...this.settingsWindowController.getAllWindows(),
        ];
        const splashWindow = this.splashLifecycle.getWindow();
        if (splashWindow && !splashWindow.isDestroyed()) {
            windows.push(splashWindow);
        }
        return windows;
    }

    /**
     * すべてのウィンドウを閉じる
     * 子ウィンドウは destroy で強制的に閉じ、メインは close で終了経路に乗せる
     */
    closeAllWindows(): void {
        this.settingsWindowController.destroySettingsWindows();
        this.destroySplashWindow();
        this.mainWindowLifecycle.closeMainWindow();
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
     * DevToolsを開く（ローカル開発環境のみ）
     */
    openDevTools(window: BrowserWindow): void {
        const shouldOpen =
            !app.isPackaged && is.dev && process.env["ELECTRON_RENDERER_URL"];

        if (shouldOpen) {
            window.webContents.openDevTools({ mode: "detach" });
        }
    }
}
