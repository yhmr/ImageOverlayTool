import { vi, expect } from "vitest";
import { ipcMain } from "electron";

/**
 * モックされた ipcMain.handle から登録されたハンドラを検索して実行するためのヘルパー
 *
 * @param channel IPCチャンネル名 (例: "project:save")
 * @param event 模擬的なイベントオブジェクト (デフォルトは { sender: {} })
 * @param args ハンドラに渡す引数
 * @returns ハンドラの実行結果
 */
export const invokeIpcHandler = async (
    channel: string,
    event: any = { sender: {} },
    ...args: any[]
) => {
    const calls = vi.mocked(ipcMain.handle).mock.calls;
    const handler = calls.find((call) => call[0] === channel)?.[1];

    if (!handler) {
        throw new Error(`IPC handler for channel "${channel}" not found.`);
    }

    return await handler(event, ...args);
};
