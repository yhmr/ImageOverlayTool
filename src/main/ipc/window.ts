import { ipcMain, BrowserWindow } from "electron";
import log from "../logger";
import { windowIpcContracts } from "../../shared/ipc/contracts";
import type { WindowRect } from "../../shared/ipc/contracts/window";

export const registerWindowHandlers = (mainWindow: BrowserWindow) => {
    ipcMain.handle(windowIpcContracts.minimize.channel, async () => {
        log.info("[IPC] window:minimize called");
        mainWindow.minimize();
    });

    ipcMain.handle(windowIpcContracts.switchSize.channel, async () => {
        if (!mainWindow.isMaximized()) {
            log.debug("[IPC] window:switchSize -> maximizing");
            mainWindow.maximize();
            return true;
        } else {
            log.debug("[IPC] window:switchSize -> unmaximizing");
            mainWindow.unmaximize();
            mainWindow.setResizable(true);
            return false;
        }
    });

    ipcMain.handle(windowIpcContracts.close.channel, async () => {
        log.info("[IPC] window:close called");
        mainWindow.close();
    });

    ipcMain.handle(
        windowIpcContracts.setRect.channel,
        async (event, rect: WindowRect) => {
            log.debug(`[IPC] window:setRect called: ${JSON.stringify(rect)}`);
            const targetWindow =
                BrowserWindow.fromWebContents(event.sender) ?? mainWindow;
            targetWindow.setBounds(rect);
        }
    );

    ipcMain.handle(
        windowIpcContracts.setIgnoreMouseEvents.channel,
        async (event, ignore: boolean) => {
            const targetWindow =
                BrowserWindow.fromWebContents(event.sender) ?? mainWindow;
            targetWindow.setIgnoreMouseEvents(Boolean(ignore), {
                forward: true,
            });
        }
    );

    ipcMain.handle(
        windowIpcContracts.setAlwaysOnTop.channel,
        async (event, enabled: boolean) => {
            const targetWindow =
                BrowserWindow.fromWebContents(event.sender) ?? mainWindow;
            targetWindow.setAlwaysOnTop(Boolean(enabled));
        }
    );
};
