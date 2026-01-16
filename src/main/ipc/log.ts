/**
 * ログ出力用IPCハンドラー
 * レンダラープロセスからのログ出力要求を処理する
 */
import { ipcMain } from "electron";
import log from "../logger";

// ログレベルの型定義
type LogLevel = "debug" | "info" | "warn" | "error";

/**
 * ログ出力IPCハンドラーを登録する
 */
export function registerLogHandlers(): void {
    ipcMain.handle(
        "log:write",
        (_event, level: LogLevel, message: string, params: unknown[]): void => {
            switch (level) {
                case "debug":
                    log.debug(`[Renderer] ${message}`, ...params);
                    break;
                case "info":
                    log.info(`[Renderer] ${message}`, ...params);
                    break;
                case "warn":
                    log.warn(`[Renderer] ${message}`, ...params);
                    break;
                case "error":
                    log.error(`[Renderer] ${message}`, ...params);
                    break;
            }
        }
    );
}
