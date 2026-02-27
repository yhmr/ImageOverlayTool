import { BrowserWindow, dialog, ipcMain } from "electron";
import { projectIpcContracts } from "../../../shared/ipc/contracts/project";
import log from "../../logger";
import type { ProjectHandlerContext } from "./types";

/**
 * プロジェクトファイルの読み込みに関するIPCハンドラーを登録します。
 * OSネイティブのファイル選択ダイアログを使用した読み込みや、
 * ファイルパス指定での直接読み込み、およびE2Eテスト環境での読み込みをサポートします。
 *
 * @param context ハンドラー間で共有するコンテキスト(リポジトリやテスト設定)
 */
export const registerProjectLoadHandlers = (
    context: ProjectHandlerContext
): void => {
    ipcMain.handle(projectIpcContracts.load.channel, async (event) => {
        log.debug("[IPC] project:load called");

        if (context.testMode?.enabled) {
            try {
                const project = await context.repository.loadProject(
                    context.testMode.projectFilePath
                );
                log.info(
                    `[IPC] project:load completed in e2e mode: ${context.testMode.projectFilePath}`
                );
                return { project, filePath: context.testMode.projectFilePath };
            } catch {
                log.debug(
                    `[IPC] project:load e2e source unavailable: ${context.testMode.projectFilePath}`
                );
                return null;
            }
        }

        const window = BrowserWindow.fromWebContents(event.sender);
        const options: Electron.OpenDialogOptions = {
            title: "Open Project",
            filters: [{ name: "Overlay Project", extensions: ["iot"] }],
            properties: ["openFile"],
        };
        try {
            const { canceled, filePaths } = window
                ? await dialog.showOpenDialog(window, options)
                : await dialog.showOpenDialog(options);

            if (canceled || filePaths.length === 0) {
                log.debug("[IPC] project:load canceled by user");
                return null;
            }

            const filePath = filePaths[0];
            const project = await context.repository.loadProject(filePath);
            log.info(`[IPC] project:load completed: ${filePath}`);
            return { project, filePath };
        } catch (error) {
            log.error("[IPC] project:load failed:", error);
            throw error;
        }
    });

    ipcMain.handle(
        projectIpcContracts.loadFromPath.channel,
        async (_event, filePath: string) => {
            log.debug(`[IPC] project:loadFromPath called for: ${filePath}`);
            try {
                const project = await context.repository.loadProject(filePath);
                log.info(`[IPC] project:loadFromPath completed: ${filePath}`);
                return { project, filePath };
            } catch (error) {
                log.error(
                    `[IPC] project:loadFromPath failed for ${filePath}:`,
                    error
                );
                return null;
            }
        }
    );
};
