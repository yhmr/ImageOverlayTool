import path from "path";
import { BrowserWindow } from "electron";
import { is, platform } from "@electron-toolkit/utils";
import { IWindowRepository } from "../repositories/WindowRepository";
import log from "../logger";
import {
    MIN_DIMENSION_SETTINGS_WINDOW_SIZE,
    MIN_IMAGE_SETTINGS_WINDOW_SIZE,
} from "../../shared/types/AppConfig";

interface SettingsWindowControllerOptions {
    windowRepository: IWindowRepository;
    getMainWindow: () => BrowserWindow | null;
    isQuitting: () => boolean;
    resetDimensionInteractionState: () => void;
}

/**
 * サブウィンドウ（画像設定/寸法線設定）の生成と表示制御を管理する
 */
export class SettingsWindowController {
    private imageSettingsWindow: BrowserWindow | null = null;
    private dimensionSettingsWindow: BrowserWindow | null = null;

    constructor(private readonly options: SettingsWindowControllerOptions) {}

    /**
     * 画像設定ウィンドウを作成（既存があれば再利用）
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
            this.options.windowRepository.getImageSettingsWindowPositionAndSize();

        this.imageSettingsWindow = new BrowserWindow({
            show: false,
            width: size.width,
            height: size.height,
            minWidth: MIN_IMAGE_SETTINGS_WINDOW_SIZE.width,
            minHeight: MIN_IMAGE_SETTINGS_WINDOW_SIZE.height,
            x: pos.x,
            y: pos.y,
            parent: this.options.getMainWindow() ?? undefined,
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

        this.imageSettingsWindow.on("ready-to-show", () => {
            this.imageSettingsWindow?.show();
        });

        this.imageSettingsWindow.on("close", (event) => {
            // 閉じる直前に位置/サイズを保存
            if (this.imageSettingsWindow) {
                this.options.windowRepository.saveImageSettingsWindowPositionAndSize(
                    this.imageSettingsWindow.getPosition(),
                    this.imageSettingsWindow.getSize()
                );
            }

            // 終了シーケンス中は実際に閉じる
            if (this.options.isQuitting()) {
                return;
            }

            // 通常時はトグル動作として hide へ切り替える
            event.preventDefault();
            this.imageSettingsWindow?.hide();
        });

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
     * 寸法線設定ウィンドウを作成（既存があれば再利用）
     */
    createDimensionSettingsWindow(): BrowserWindow {
        if (
            this.dimensionSettingsWindow &&
            !this.dimensionSettingsWindow.isDestroyed()
        ) {
            log.debug("Dimension settings window already exists, focusing");
            this.dimensionSettingsWindow.focus();
            return this.dimensionSettingsWindow;
        }

        log.debug("Creating dimension settings window...");
        const { pos, size } =
            this.options.windowRepository.getDimensionSettingsWindowPositionAndSize();

        this.dimensionSettingsWindow = new BrowserWindow({
            show: false,
            width: size.width,
            height: size.height,
            minWidth: MIN_DIMENSION_SETTINGS_WINDOW_SIZE.width,
            minHeight: MIN_DIMENSION_SETTINGS_WINDOW_SIZE.height,
            x: pos.x,
            y: pos.y,
            parent: this.options.getMainWindow() ?? undefined,
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

        this.dimensionSettingsWindow.on("ready-to-show", () => {
            this.dimensionSettingsWindow?.show();
        });

        this.dimensionSettingsWindow.on("close", (event) => {
            // 閉じる直前に位置/サイズを保存
            if (this.dimensionSettingsWindow) {
                this.options.windowRepository.saveDimensionSettingsWindowPositionAndSize(
                    this.dimensionSettingsWindow.getPosition(),
                    this.dimensionSettingsWindow.getSize()
                );
            }

            // 終了シーケンス中は実際に閉じる
            if (this.options.isQuitting()) {
                return;
            }

            // 通常時はトグル動作として hide し、操作モードを初期化する
            event.preventDefault();
            this.dimensionSettingsWindow?.hide();
            this.options.resetDimensionInteractionState();
        });

        if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
            this.dimensionSettingsWindow.loadURL(
                process.env["ELECTRON_RENDERER_URL"] + "/dimension-settings/"
            );
        } else {
            this.dimensionSettingsWindow.loadFile(
                path.join(
                    __dirname,
                    "../renderer/dimension-settings/index.html"
                )
            );
        }

        log.info("Dimension settings window created");
        return this.dimensionSettingsWindow;
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
            this.options.windowRepository.saveImageSettingsWindowPositionAndSize(
                this.imageSettingsWindow.getPosition(),
                this.imageSettingsWindow.getSize()
            );
            this.imageSettingsWindow.hide();
            return false;
        }

        log.debug("Showing image settings window");
        this.imageSettingsWindow.show();
        this.imageSettingsWindow.focus();
        return true;
    }

    /**
     * 寸法線設定ウィンドウの表示/非表示をトグル
     */
    toggleDimensionSettingsWindow(): boolean {
        if (
            !this.dimensionSettingsWindow ||
            this.dimensionSettingsWindow.isDestroyed()
        ) {
            log.debug("Dimension settings window not found, creating new one");
            this.createDimensionSettingsWindow();
            return true;
        }

        if (this.dimensionSettingsWindow.isVisible()) {
            log.debug("Hiding dimension settings window");
            this.options.windowRepository.saveDimensionSettingsWindowPositionAndSize(
                this.dimensionSettingsWindow.getPosition(),
                this.dimensionSettingsWindow.getSize()
            );
            this.dimensionSettingsWindow.hide();
            this.options.resetDimensionInteractionState();
            return false;
        }

        log.debug("Showing dimension settings window");
        this.dimensionSettingsWindow.show();
        this.dimensionSettingsWindow.focus();
        return true;
    }

    /**
     * 画像設定ウィンドウを取得
     */
    getImageSettingsWindow(): BrowserWindow | null {
        return this.imageSettingsWindow;
    }

    /**
     * 寸法線設定ウィンドウを取得
     */
    getDimensionSettingsWindow(): BrowserWindow | null {
        return this.dimensionSettingsWindow;
    }

    /**
     * 有効な設定ウィンドウ一覧を返す
     */
    getAllWindows(): BrowserWindow[] {
        const windows: BrowserWindow[] = [];
        if (
            this.imageSettingsWindow &&
            !this.imageSettingsWindow.isDestroyed()
        ) {
            windows.push(this.imageSettingsWindow);
        }
        if (
            this.dimensionSettingsWindow &&
            !this.dimensionSettingsWindow.isDestroyed()
        ) {
            windows.push(this.dimensionSettingsWindow);
        }
        return windows;
    }

    /**
     * 終了シーケンスで設定ウィンドウを通常 close する
     */
    closeSettingsWindows(): void {
        if (
            this.imageSettingsWindow &&
            !this.imageSettingsWindow.isDestroyed()
        ) {
            this.imageSettingsWindow.close();
        }
        if (
            this.dimensionSettingsWindow &&
            !this.dimensionSettingsWindow.isDestroyed()
        ) {
            this.dimensionSettingsWindow.close();
        }
    }

    /**
     * 強制終了経路で設定ウィンドウを destroy する
     */
    destroySettingsWindows(): void {
        if (
            this.imageSettingsWindow &&
            !this.imageSettingsWindow.isDestroyed()
        ) {
            this.imageSettingsWindow.destroy();
            this.imageSettingsWindow = null;
        }
        if (
            this.dimensionSettingsWindow &&
            !this.dimensionSettingsWindow.isDestroyed()
        ) {
            this.dimensionSettingsWindow.destroy();
            this.dimensionSettingsWindow = null;
        }
    }
}
