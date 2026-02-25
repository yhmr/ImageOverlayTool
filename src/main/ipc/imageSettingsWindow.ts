import fs from "fs/promises";
import path from "path";
import {
    ipcMain,
    dialog,
    BrowserWindow,
    clipboard,
    nativeImage,
} from "electron";
import type {
    IDimensionSettingsWindowController,
    IImageSettingsWindowController,
    IProjectDirtyStateController,
    IWindowCollectionProvider,
} from "../windows/windowManager";
import { ImageSet } from "../../shared/types/ImageSet";
import { DimensionLine } from "../../shared/types/DimensionLine";
import type { InteractionMode } from "../../shared/types/InteractionMode";
import type { ImageInfoResult } from "../../shared/types/ImageInfo";
import log from "../logger";
import {
    dimensionSettingsWindowIpcContracts,
    imageSettingsWindowIpcContracts,
    syncEventContracts,
    syncIpcContracts,
} from "../../shared/ipc/contracts";
import type { Unit } from "../../shared/ipc/contracts/sync";
import { IMAGE_FILTERS } from "../../shared/constants/imageFormats";
import {
    deleteClipboardCacheFileIfManaged,
    isManagedClipboardCachePath,
    saveClipboardImageToCache,
} from "../services/clipboardCacheService";
import { fromLocalFileUrl } from "../../shared/utils/localFileUrl";

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
 * 画像設定ウィンドウ用のIPCハンドラを登録
 */
export const registerImageSettingsWindowHandlers = (
    windowManager: IImageSettingsWindowController &
        IDimensionSettingsWindowController &
        IWindowCollectionProvider &
        IProjectDirtyStateController
) => {
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
        syncIpcContracts.updateImageSets.channel,
        (event, imageSets: ImageSet[]) => {
            log.debug(
                `[IPC] imageSets:update called with ${imageSets.length} images`
            );
            const windows = windowManager.getAllWindows();
            windows.forEach((win) => {
                if (win.webContents.id !== event.sender.id) {
                    win.webContents.send(
                        syncEventContracts.imageSetsUpdated.event,
                        imageSets
                    );
                }
            });
        }
    );

    ipcMain.handle(
        syncIpcContracts.updateDimensionLines.channel,
        (event, dimensionLines: DimensionLine[]) => {
            log.debug(
                `[IPC] dimensionLines:update called with ${dimensionLines.length} lines`
            );
            const windows = windowManager.getAllWindows();
            windows.forEach((win) => {
                if (win.webContents.id !== event.sender.id) {
                    win.webContents.send(
                        syncEventContracts.dimensionLinesUpdated.event,
                        dimensionLines
                    );
                }
            });
        }
    );

    ipcMain.handle(
        syncIpcContracts.updateUnitFactor.channel,
        (event, unitFactor: number) => {
            log.debug(
                `[IPC] unitFactor:update called with value: ${unitFactor}`
            );
            const windows = windowManager.getAllWindows();
            windows.forEach((win) => {
                if (win.webContents.id !== event.sender.id) {
                    win.webContents.send(
                        syncEventContracts.unitFactorUpdated.event,
                        unitFactor
                    );
                }
            });
        }
    );

    ipcMain.handle(syncIpcContracts.updateUnit.channel, (event, unit: Unit) => {
        log.debug(`[IPC] unit:update called with value: ${unit}`);
        const windows = windowManager.getAllWindows();
        windows.forEach((win) => {
            if (win.webContents.id !== event.sender.id) {
                win.webContents.send(
                    syncEventContracts.unitUpdated.event,
                    unit
                );
            }
        });
    });

    ipcMain.handle(
        syncIpcContracts.updateInteractionMode.channel,
        (event, mode: InteractionMode) => {
            log.debug(
                `[IPC] interactionMode:update called with value: ${mode}`
            );
            const windows = windowManager.getAllWindows();
            windows.forEach((win) => {
                if (win.webContents.id !== event.sender.id) {
                    win.webContents.send(
                        syncEventContracts.interactionModeUpdated.event,
                        mode
                    );
                }
            });
        }
    );

    ipcMain.handle(
        syncIpcContracts.updateSelectedImageId.channel,
        (event, id: string | null) => {
            log.debug(`[IPC] selectedImageId:update called with value: ${id}`);
            const windows = windowManager.getAllWindows();
            windows.forEach((win) => {
                if (win.webContents.id !== event.sender.id) {
                    win.webContents.send(
                        syncEventContracts.selectedImageIdUpdated.event,
                        id
                    );
                }
            });
        }
    );

    ipcMain.handle(
        syncIpcContracts.updateSelectedDimensionLineId.channel,
        (event, id: string | null) => {
            log.debug(
                `[IPC] selectedDimensionLineId:update called with value: ${id}`
            );
            const windows = windowManager.getAllWindows();
            windows.forEach((win) => {
                if (win.webContents.id !== event.sender.id) {
                    win.webContents.send(
                        syncEventContracts.selectedDimensionLineIdUpdated.event,
                        id
                    );
                }
            });
        }
    );

    ipcMain.handle(
        syncIpcContracts.updateProjectDirty.channel,
        (_event, isDirty) => {
            windowManager.setProjectDirty(Boolean(isDirty));
        }
    );

    ipcMain.handle(syncIpcContracts.requestInitialState.channel, (event) => {
        log.debug("[IPC] state:requestInitial called");
        const windows = windowManager.getAllWindows();
        windows.forEach((win) => {
            if (win.webContents.id !== event.sender.id) {
                win.webContents.send(syncEventContracts.requestStateSync.event);
            }
        });
    });

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
