import { ipcMain, dialog, BrowserWindow } from "electron";
import { IProjectRepository } from "../repositories/ProjectRepository";
import { ProjectFile } from "../../shared/types/ProjectFile";

export const registerProjectHandlers = (repository: IProjectRepository) => {
  /**
   * [IPC] プロジェクトファイルの保存
   */
  ipcMain.handle("project:saveAs", async (event, project: ProjectFile) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    const options = {
      title: "Save Project",
      defaultPath: "project.iot",
      filters: [{ name: "Overlay Project", extensions: ["iot"] }],
    };
    const { canceled, filePath } = window
      ? await dialog.showSaveDialog(window, options)
      : await dialog.showSaveDialog(options);

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
    async (
      event,
      { filePath, project }: { filePath: string; project: ProjectFile }
    ) => {
      await repository.saveProject(filePath, project);
      return true;
    }
  );

  /**
   * [IPC] プロジェクトファイルの読み込み
   */
  ipcMain.handle("project:load", async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    const options: Electron.OpenDialogOptions = {
      title: "Open Project",
      filters: [{ name: "Overlay Project", extensions: ["iot"] }],
      properties: ["openFile"],
    };
    const { canceled, filePaths } = window
      ? await dialog.showOpenDialog(window, options)
      : await dialog.showOpenDialog(options);

    if (canceled || filePaths.length === 0) {
      return null;
    }

    const filePath = filePaths[0];
    const project = await repository.loadProject(filePath);
    return { project, filePath };
  });

  /**
   * [IPC] パスを指定してプロジェクトファイルを読み込み
   */
  ipcMain.handle("project:loadFromPath", async (event, filePath: string) => {
    try {
      const project = await repository.loadProject(filePath);
      return { project, filePath };
    } catch (e) {
      console.error(e);
      return null;
    }
  });
};
