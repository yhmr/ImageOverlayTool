import { registerClipboardHandlers } from "./imageSettingsWindow/clipboardHandlers";
import { registerImageSettingsWindowCoreHandlers } from "./imageSettingsWindow/imageSettingsWindowHandlers";
import { registerSyncHandlers } from "./imageSettingsWindow/syncHandlers";
import type { ImageSettingsWindowHandlerDependencies } from "./imageSettingsWindow/types";

/**
 * 画像設定ウィンドウ用のIPCハンドラを登録
 */
export const registerImageSettingsWindowHandlers = (
    windowManager: ImageSettingsWindowHandlerDependencies
): void => {
    registerImageSettingsWindowCoreHandlers(windowManager);
    registerSyncHandlers(windowManager);
    registerClipboardHandlers();
};
