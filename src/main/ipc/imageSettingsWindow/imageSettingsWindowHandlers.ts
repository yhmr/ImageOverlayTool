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
