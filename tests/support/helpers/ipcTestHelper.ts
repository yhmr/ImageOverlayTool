import { vi } from "vitest";
import { ipcMain } from "electron";

type IpcHandler = (event: unknown, ...args: unknown[]) => unknown;
type IpcMainHandle = typeof ipcMain.handle;

const ipcHandlerRegistry = new Map<string, IpcHandler>();
let delegatedHandleImplementation: IpcMainHandle | undefined;
let clearAllMocksPatched = false;

const captureHandleRegistration: IpcMainHandle = ((channel, handler) => {
    ipcHandlerRegistry.set(channel, handler as IpcHandler);
    return delegatedHandleImplementation?.(channel, handler);
}) as IpcMainHandle;

const ensureIpcHandlerCapture = () => {
    const handleMock = vi.mocked(ipcMain.handle);
    const currentImplementation = handleMock.getMockImplementation();

    if (currentImplementation === captureHandleRegistration) {
        return;
    }

    delegatedHandleImplementation = currentImplementation as
        | IpcMainHandle
        | undefined;
    handleMock.mockImplementation(captureHandleRegistration);
};

const patchClearAllMocks = () => {
    if (clearAllMocksPatched) {
        return;
    }

    const originalClearAllMocks = vi.clearAllMocks.bind(vi);
    vi.clearAllMocks = (() => {
        ipcHandlerRegistry.clear();
        return originalClearAllMocks();
    }) as typeof vi.clearAllMocks;
    clearAllMocksPatched = true;
};

/**
 * IPCハンドラ登録キャプチャのレジストリを明示的に初期化する。
 * 通常は自動初期化されるが、テスト側で明示的に空にしたい場合に利用する。
 */
export const resetIpcHandlerRegistry = () => {
    ipcHandlerRegistry.clear();
};

export const getIpcHandler = (channel: string): IpcHandler => {
    ensureIpcHandlerCapture();
    const handler = ipcHandlerRegistry.get(channel);

    if (!handler) {
        const registeredChannels = Array.from(ipcHandlerRegistry.keys());
        throw new Error(
            `IPC handler for channel "${channel}" not found. registered=${registeredChannels.join(",")}`
        );
    }

    return handler;
};

/**
 * モックされた ipcMain.handle から登録されたハンドラを検索して実行するためのヘルパー
 *
 * @param channel IPCチャンネル名 (例: "project:save")
 * @param event 模擬的なイベントオブジェクト (デフォルトは { sender: {} })
 * @param args ハンドラに渡す引数
 * @returns ハンドラの実行結果
 */
export const invokeIpcHandler = async <TResult = unknown>(
    channel: string,
    event: unknown = { sender: {} },
    ...args: unknown[]
): Promise<TResult> => {
    ensureIpcHandlerCapture();
    const handler = getIpcHandler(channel);
    return (await handler(event, ...args)) as TResult;
};

patchClearAllMocks();
ensureIpcHandlerCapture();
