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
            if (["debug", "info", "warn", "error"].includes(level)) {
                const rendererLog = log.scope("renderer");
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (rendererLog as any)[level](message, ...params);
            } else {
                console.warn(`[IPC] Invalid log level: ${level}`);
            }
        }
    );
}
