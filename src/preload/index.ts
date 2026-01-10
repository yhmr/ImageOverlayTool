import { contextBridge, ipcRenderer } from "electron";
import type { SettingType } from "../shared/types/AppConfig";

import type { ProjectFile } from "../shared/types/ProjectFile";

contextBridge.exposeInMainWorld("electronAPI", {
  openFile: () => ipcRenderer.invoke("dialog:openFile"),
  // Window
  switchWindowSize: (): Promise<boolean> =>
    ipcRenderer.invoke("window:switchSize"),
  setWindowRect: (rect: { x: number; y: number; width: number; height: number }) =>
    ipcRenderer.invoke("window:setRect", rect),
  closeWindow: () => ipcRenderer.invoke("window:close"),
  // Setting
  loadSetting: () => ipcRenderer.invoke("setting:load"),
  saveSetting: (setting: SettingType) =>
    ipcRenderer.invoke("setting:save", setting),
  // Window Color
  loadWindowColor: () => ipcRenderer.invoke("window_color:load"),
  saveWindowColor: (color: string) =>
    ipcRenderer.invoke("window_color:save", color),
  // Project
  saveProjectAs: (project: ProjectFile) =>
    ipcRenderer.invoke("project:saveAs", project),
  saveProject: (filePath: string, project: ProjectFile) =>
    ipcRenderer.invoke("project:save", { filePath, project }),
  loadProject: () => ipcRenderer.invoke("project:load"),
});
