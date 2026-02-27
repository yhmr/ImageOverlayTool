import fs from "fs/promises";
import path from "path";
import { BrowserWindow, dialog, ipcMain, nativeImage } from "electron";
import type { ImageInfoResult } from "../../../shared/types/ImageInfo";
import {
    dimensionSettingsWindowIpcContracts,
    imageSettingsWindowIpcContracts,
} from "../../../shared/ipc/contracts";
import { IMAGE_FILTERS } from "../../../shared/constants/imageFormats";
import { fromLocalFileUrl } from "../../../shared/utils/localFileUrl";
import log from "../../logger";
import type { ImageSettingsWindowHandlerDependencies } from "./types";

/**
 * URIスキーム(local-file:// 等)や通常のパス文字列から、ローカルファイルシステムの絶対パスを解決します。
 * パス・トラバーサル等を防ぎ、安全な絶対パスのみを許可します。
 *
 * @param value パスまたはURLを含む文字列
 * @returns 解決され検証された絶対パス文字列 (無効な場合はnull)
 */
const resolveLocalFilePath = (value: string): string | null => {
    const isAbsoluteFilesystemPath = (targetPath: string): boolean =>
        path.isAbsolute(targetPath) || path.win32.isAbsolute(targetPath);

    if (!value || typeof value !== "string") {
        return null;
    }

    if (value.startsWith("local-file://")) {
        const parsed = fromLocalFileUrl(value);
        if (!parsed) {
            return null;
        }
        const normalizedPath = path.normalize(parsed);
        return isAbsoluteFilesystemPath(normalizedPath) ? normalizedPath : null;
    }

    const normalizedPath = path.normalize(value);
    return isAbsoluteFilesystemPath(normalizedPath) ? normalizedPath : null;
};

/**
 * 画像設定・寸法設定ウィンドウの表示切り替えや、OSネイティブの画像読み込みダイアログ、
 * 画像ファイルの基本的な情報(存在可否やサイズ)取得など、コアとなる機能のIPCハンドラーを登録します。
 *
 * @param windowManager ウィンドウの表示状態のトグル機能を提供するコントローラー
 */
export const registerImageSettingsWindowCoreHandlers = (
    windowManager: ImageSettingsWindowHandlerDependencies
): void => {
    ipcMain.handle(imageSettingsWindowIpcContracts.toggle.channel, async () => {
        log.debug("[IPC] imageSettingsWindow:toggle called");
        const isVisible = windowManager.toggleImageSettingsWindow();
        log.info(`[IPC] imageSettingsWindow:toggle -> visible: ${isVisible}`);
        return isVisible;
    });

    ipcMain.handle(
        dimensionSettingsWindowIpcContracts.toggle.channel,
        async () => {
            log.debug("[IPC] dimensionSettingsWindow:toggle called");
            const isVisible = windowManager.toggleDimensionSettingsWindow();
            log.info(
                `[IPC] dimensionSettingsWindow:toggle -> visible: ${isVisible}`
            );
            return isVisible;
        }
    );

    ipcMain.handle(
        imageSettingsWindowIpcContracts.loadImage.channel,
        async (event) => {
            log.debug("[IPC] image:load called");
            const window = BrowserWindow.fromWebContents(event.sender);
            if (!window) {
                log.warn("[IPC] image:load - window not found");
                return;
            }

            try {
                const { canceled, filePaths } = await dialog.showOpenDialog(
                    window,
                    {
                        buttonLabel: "Open",
                        filters: IMAGE_FILTERS,
                        properties: ["openFile"],
                    }
                );

                if (canceled) {
                    log.debug("[IPC] image:load canceled by user");
                    return;
                }

                log.info(`[IPC] image:load selected: ${filePaths[0]}`);
                return filePaths[0];
            } catch (error) {
                log.error("[IPC] image:load failed:", error);
                throw error;
            }
        }
    );

    ipcMain.handle(
        imageSettingsWindowIpcContracts.getImageInfo.channel,
        async (_event, imagePath: string): Promise<ImageInfoResult> => {
            const resolvedPath = resolveLocalFilePath(imagePath);
            if (!resolvedPath) {
                return { exists: false };
            }

            try {
                await fs.access(resolvedPath);
            } catch {
                return { exists: false };
            }

            const image = nativeImage.createFromPath(resolvedPath);
            if (image.isEmpty()) {
                return { exists: true };
            }

            const size = image.getSize();
            if (size.width > 0 && size.height > 0) {
                return {
                    exists: true,
                    width: size.width,
                    height: size.height,
                };
            }

            return { exists: true };
        }
    );
};
