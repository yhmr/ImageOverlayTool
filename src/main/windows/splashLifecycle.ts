import path from "path";
import { BrowserWindow } from "electron";
import { is } from "@electron-toolkit/utils";
import log from "../logger";

/**
 * スプラッシュウィンドウの生成・表示時間管理・破棄を担当する
 */
export class SplashLifecycle {
    private static readonly MINIMUM_DURATION = 1500; // ms

    private splashWindow: BrowserWindow | null = null;
    private splashDisplayTime: number | null = null;

    /**
     * スプラッシュを作成して ready-to-show まで待機する
     */
    async show(): Promise<BrowserWindow> {
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
                // 表示完了時刻を保存して最低表示時間を算出できるようにする
                this.splashDisplayTime = Date.now();
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
     * スプラッシュウィンドウを破棄し、計測状態もリセットする
     */
    destroy(): void {
        if (this.splashWindow && !this.splashWindow.isDestroyed()) {
            log.debug("Destroying splash window...");
            this.splashWindow.destroy();
        }
        this.splashWindow = null;
        this.splashDisplayTime = null;
    }

    /**
     * 現在のスプラッシュウィンドウを取得
     */
    getWindow(): BrowserWindow | null {
        return this.splashWindow;
    }

    /**
     * 最低表示時間を満たすまでの残り待機時間を返す
     */
    getRemainingDelay(now: number = Date.now()): number {
        if (this.splashDisplayTime === null) {
            return 0;
        }
        const elapsed = now - this.splashDisplayTime;
        return Math.max(0, SplashLifecycle.MINIMUM_DURATION - elapsed);
    }
}
