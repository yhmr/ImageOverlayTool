import { contextBridge, ipcRenderer } from "electron";
import type { SettingType } from "../shared/types/AppConfig";

import type { ProjectFile } from "../shared/types/ProjectFile";
import type { ImageSet } from "../renderer/types/ImageSet";

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
  // Image Settings Window
  toggleImageSettingsWindow: () =>
    ipcRenderer.invoke("imageSettingsWindow:toggle"),
  // ImageSets Sync
  updateImageSets: (imageSets: ImageSet[]) =>
    ipcRenderer.invoke("imageSets:update", imageSets),
  onImageSetsUpdated: (callback: (imageSets: ImageSet[]) => void) => {
    const subscription = (_event: unknown, imageSets: ImageSet[]) =>
      callback(imageSets);
    ipcRenderer.on("imageSets:updated", subscription);
    return () => ipcRenderer.removeListener("imageSets:updated", subscription);
  },
  // Unit Factor Sync
  updateUnitFactor: (unitFactor: number) =>
    ipcRenderer.invoke("unitFactor:update", unitFactor),
  onUnitFactorUpdated: (callback: (unitFactor: number) => void) => {
    const subscription = (_event: unknown, unitFactor: number) =>
      callback(unitFactor);
    ipcRenderer.on("unitFactor:updated", subscription);
    return () => ipcRenderer.removeListener("unitFactor:updated", subscription);
  },
  // Initial State Sync
  requestInitialState: () => ipcRenderer.invoke("state:requestInitial"),
  onRequestStateSync: (callback: () => void) => {
    const subscription = () => callback();
    ipcRenderer.on("state:requestSync", subscription);
    return () => ipcRenderer.removeListener("state:requestSync", subscription);
  },
});
