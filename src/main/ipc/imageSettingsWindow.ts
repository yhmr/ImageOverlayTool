import { registerClipboardHandlers } from "./imageSettingsWindow/clipboardHandlers";
import { registerImageSettingsWindowCoreHandlers } from "./imageSettingsWindow/imageSettingsWindowHandlers";
import { registerSyncHandlers } from "./imageSettingsWindow/syncHandlers";
import type { ImageSettingsWindowHandlerDependencies } from "./imageSettingsWindow/types";

/**
 * 画像設定ウィンドウやそれに付随する寸法設定ウィンドウ・同期機能・クリップボード連携など、
 * UIと機能の根幹となるIPCハンドラーを登録します。
 *
 * @param windowManager 各種ウィンドウの制御や状態(Dirtyフラグ等)を提供する依存関係
 */
export const registerImageSettingsWindowHandlers = (
    windowManager: ImageSettingsWindowHandlerDependencies
): void => {
    registerImageSettingsWindowCoreHandlers(windowManager);
    registerSyncHandlers(windowManager);
    registerClipboardHandlers();
};
