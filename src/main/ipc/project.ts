import { ipcMain, dialog, BrowserWindow } from "electron";
import { IProjectRepository } from "../repositories/ProjectRepository";
import { ProjectFile } from "../../shared/types/ProjectFile";

export const registerProjectHandlers = (
    mainWindow: BrowserWindow,
    repository: IProjectRepository
) => {
    /**
     * [IPC] プロジェクトファイルの保存
     */
    ipcMain.handle("project:saveAs", async (event, project: ProjectFile) => {
        const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
            title: "Save Project",
            defaultPath: "project.opj",
            filters: [{ name: "Overlay Project", extensions: ["opj", "json"] }],
        });

        if (canceled || !filePath) {
            return null;
        }

        await repository.saveProject(filePath, project);
        return filePath;
    });

    /**
     * [IPC] プロジェクトファイルの上書き保存
     */
    ipcMain.handle(
        "project:save",
        async (event, { filePath, project }: { filePath: string; project: ProjectFile }) => {
            await repository.saveProject(filePath, project);
            return true;
        }
    );

    /**
     * [IPC] プロジェクトファイルの読み込み
     */
    ipcMain.handle("project:load", async () => {
        const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
            title: "Open Project",
            filters: [{ name: "Overlay Project", extensions: ["opj", "json"] }],
            properties: ["openFile"],
        });

        if (canceled || filePaths.length === 0) {
            return null;
        }

        const filePath = filePaths[0];
        const project = await repository.loadProject(filePath);
        return { project, filePath };
    });
};
