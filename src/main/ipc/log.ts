/**
 * ログ出力用IPCハンドラー
 * レンダラープロセスからのログ出力要求を処理する
 */
import fs from "fs/promises";
import path from "path";
import { app, dialog, ipcMain } from "electron";
import log from "../logger";
import { IPC_CHANNELS } from "../../shared/ipc/channels";

// ログレベルの型定義
type LogLevel = "debug" | "info" | "warn" | "error";

/**
 * ログ出力IPCハンドラーを登録する
 */
export function registerLogHandlers(): void {
    ipcMain.handle(
        IPC_CHANNELS.log.write,
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

    ipcMain.handle(IPC_CHANNELS.log.export, async () => {
        try {
            const result = await dialog.showSaveDialog({
                title: "Export Logs",
                defaultPath: path.join(
                    app.getPath("desktop"),
                    "imageoverlaytool-logs.txt"
                ),
                filters: [{ name: "Text", extensions: ["txt"] }],
            });

            if (result.canceled || !result.filePath) {
                return null;
            }

            const logs = log.transports.file.readAllLogs();
            const serialized = logs
                .map(
                    (entry) =>
                        `===== ${entry.path} =====\n${entry.lines.join("\n")}`
                )
                .join("\n\n");

            await fs.writeFile(result.filePath, serialized, "utf8");
            log.info(`[IPC] log:export completed: ${result.filePath}`);
            return result.filePath;
        } catch (error) {
            log.error("[IPC] log:export failed:", error);
            throw error;
        }
    });
}
