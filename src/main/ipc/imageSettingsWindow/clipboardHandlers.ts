import fs from "fs/promises";
import path from "path";
import { BrowserWindow, clipboard, dialog, ipcMain } from "electron";
import { imageSettingsWindowIpcContracts } from "../../../shared/ipc/contracts";
import { IMAGE_FILTERS } from "../../../shared/constants/imageFormats";
import {
    deleteClipboardCacheFileIfManaged,
    isManagedClipboardCachePath,
    saveClipboardImageToCache,
} from "../../services/clipboardCacheService";
import log from "../../logger";

/**
 * クリップボードからの画像ペースト(キャッシュへの一時保存)や、
 * キャッシュされた画像のファイルへの保存(名前を付けて保存)を担うIPCハンドラーを登録します。
 */
export const registerClipboardHandlers = (): void => {
    ipcMain.handle(
        imageSettingsWindowIpcContracts.pasteImage.channel,
        async () => {
            log.debug("[IPC] imageSettingsWindow:pasteImage called");
            try {
                const image = clipboard.readImage();
                if (image.isEmpty()) {
                    log.debug(
                        "[IPC] imageSettingsWindow:pasteImage no image found"
                    );
                    return null;
                }

                const filePath = await saveClipboardImageToCache(image);
                log.info(
                    `[IPC] imageSettingsWindow:pasteImage cached: ${filePath}`
                );
                return filePath;
            } catch (error) {
                log.error(
                    "[IPC] imageSettingsWindow:pasteImage failed:",
                    error
                );
                throw error;
            }
        }
    );

    ipcMain.handle(
        imageSettingsWindowIpcContracts.saveCacheImageAs.channel,
        async (event, cacheFilePath: string) => {
            log.debug("[IPC] imageSettingsWindow:saveCacheImageAs called", {
                cacheFilePath,
            });

            if (!cacheFilePath || !isManagedClipboardCachePath(cacheFilePath)) {
                log.warn(
                    "[IPC] imageSettingsWindow:saveCacheImageAs invalid cache path"
                );
                return null;
            }

            const ownerWindow = BrowserWindow.fromWebContents(event.sender);
            const extension = path.extname(cacheFilePath) || ".png";
            const fallbackName = `pasted-image${extension}`;
            const baseName = path.basename(cacheFilePath);
            const defaultName =
                baseName && path.extname(baseName) ? baseName : fallbackName;

            const options = {
                title: "Save Image",
                defaultPath: defaultName,
                filters: IMAGE_FILTERS,
            };

            try {
                const result = ownerWindow
                    ? await dialog.showSaveDialog(ownerWindow, options)
                    : await dialog.showSaveDialog(options);

                if (result.canceled || !result.filePath) {
                    log.debug(
                        "[IPC] imageSettingsWindow:saveCacheImageAs canceled"
                    );
                    return null;
                }

                await fs.copyFile(cacheFilePath, result.filePath);
                await deleteClipboardCacheFileIfManaged(cacheFilePath);
                log.info(
                    `[IPC] imageSettingsWindow:saveCacheImageAs saved: ${result.filePath}`
                );
                return result.filePath;
            } catch (error) {
                log.error(
                    "[IPC] imageSettingsWindow:saveCacheImageAs failed:",
                    error
                );
                throw error;
            }
        }
    );
};
