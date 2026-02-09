import { ipcMain, dialog, BrowserWindow } from "electron";
import type {
    IImageSettingsWindowController,
    IWindowCollectionProvider,
} from "../windows/windowManager";
import { ImageSet } from "../../shared/types/ImageSet";
import log from "../logger";
import { IPC_CHANNELS, IPC_EVENTS } from "../../shared/ipc/channels";

/**
 * 画像設定ウィンドウ用のIPCハンドラを登録
 */
export const registerImageSettingsWindowHandlers = (
    windowManager: IImageSettingsWindowController & IWindowCollectionProvider
) => {
    ipcMain.handle(IPC_CHANNELS.imageSettingsWindow.toggle, async () => {
        log.debug("[IPC] imageSettingsWindow:toggle called");
        const isVisible = windowManager.toggleImageSettingsWindow();
        log.info(`[IPC] imageSettingsWindow:toggle -> visible: ${isVisible}`);
        return isVisible;
    });

    ipcMain.handle(
        IPC_CHANNELS.sync.updateImageSets,
        (event, imageSets: ImageSet[]) => {
            log.debug(
                `[IPC] imageSets:update called with ${imageSets.length} images`
            );
            const windows = windowManager.getAllWindows();
            windows.forEach((win) => {
                if (win.webContents.id !== event.sender.id) {
                    win.webContents.send(
                        IPC_EVENTS.imageSetsUpdated,
                        imageSets
                    );
                }
            });
        }
    );

    ipcMain.handle(
        IPC_CHANNELS.sync.updateUnitFactor,
        (event, unitFactor: number) => {
            log.debug(
                `[IPC] unitFactor:update called with value: ${unitFactor}`
            );
            const windows = windowManager.getAllWindows();
            windows.forEach((win) => {
                if (win.webContents.id !== event.sender.id) {
                    win.webContents.send(
                        IPC_EVENTS.unitFactorUpdated,
                        unitFactor
                    );
                }
            });
        }
    );

    ipcMain.handle(
        IPC_CHANNELS.sync.updateUnit,
        (event, unit: "nm" | "um" | "mm") => {
            log.debug(`[IPC] unit:update called with value: ${unit}`);
            const windows = windowManager.getAllWindows();
            windows.forEach((win) => {
                if (win.webContents.id !== event.sender.id) {
                    win.webContents.send(IPC_EVENTS.unitUpdated, unit);
                }
            });
        }
    );

    ipcMain.handle(IPC_CHANNELS.sync.requestInitialState, (event) => {
        log.debug("[IPC] state:requestInitial called");
        const windows = windowManager.getAllWindows();
        windows.forEach((win) => {
            if (win.webContents.id !== event.sender.id) {
                win.webContents.send(IPC_EVENTS.requestStateSync);
            }
        });
    });

    ipcMain.handle(
        IPC_CHANNELS.imageSettingsWindow.loadImage,
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
                        filters: [
                            {
                                name: "Image",
                                extensions: [
                                    "jpg",
                                    "jpeg",
                                    "png",
                                    "webp",
                                    "gif",
                                    "svg",
                                ],
                            },
                        ],
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
};
