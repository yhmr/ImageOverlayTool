import { ipcMain, dialog, BrowserWindow } from "electron";
import { IProjectRepository } from "../repositories/ProjectRepository";
import { ProjectFile } from "../../shared/types/ProjectFile";
import log from "../logger";

export const registerProjectHandlers = (repository: IProjectRepository) => {
    /**
     * [IPC] プロジェクトファイルの保存
     */
    ipcMain.handle("project:saveAs", async (event, project: ProjectFile) => {
        log.debug("[IPC] project:saveAs called");
        const window = BrowserWindow.fromWebContents(event.sender);
        const options = {
            title: "Save Project",
            defaultPath: "project.iot",
            filters: [{ name: "Overlay Project", extensions: ["iot"] }],
        };
        try {
            const { canceled, filePath } = window
                ? await dialog.showSaveDialog(window, options)
                : await dialog.showSaveDialog(options);

            if (canceled || !filePath) {
                log.debug("[IPC] project:saveAs canceled by user");
                return null;
            }

            await repository.saveProject(filePath, project);
            log.info(`[IPC] project:saveAs saved to: ${filePath}`);
            return filePath;
        } catch (error) {
            log.error("[IPC] project:saveAs failed:", error);
            throw error;
        }
    });

    /**
     * [IPC] プロジェクトファイルの上書き保存
     */
    ipcMain.handle(
        "project:save",
        async (
            event,
            { filePath, project }: { filePath: string; project: ProjectFile }
        ) => {
            log.debug(`[IPC] project:save called for: ${filePath}`);
            try {
                await repository.saveProject(filePath, project);
                log.info(`[IPC] project:save completed: ${filePath}`);
                return true;
            } catch (error) {
                log.error(`[IPC] project:save failed for ${filePath}:`, error);
                throw error;
            }
        }
    );

    /**
     * [IPC] プロジェクトファイルの読み込み
     */
    ipcMain.handle("project:load", async (event) => {
        log.debug("[IPC] project:load called");
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
            const project = await repository.loadProject(filePath);
            log.info(`[IPC] project:load completed: ${filePath}`);
            return { project, filePath };
        } catch (error) {
            log.error("[IPC] project:load failed:", error);
            throw error;
        }
    });

    /**
     * [IPC] パスを指定してプロジェクトファイルを読み込み
     */
    ipcMain.handle("project:loadFromPath", async (event, filePath: string) => {
        log.debug(`[IPC] project:loadFromPath called for: ${filePath}`);
        try {
            const project = await repository.loadProject(filePath);
            log.info(`[IPC] project:loadFromPath completed: ${filePath}`);
            return { project, filePath };
        } catch (error) {
            log.error(
                `[IPC] project:loadFromPath failed for ${filePath}:`,
                error
            );
            return null;
        }
    });
};
