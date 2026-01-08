import { contextBridge, ipcRenderer } from "electron";

export interface SettingType {
  language?: string;
  unit_factor?: number;
}

contextBridge.exposeInMainWorld("electronAPI", {
  openFile: () => ipcRenderer.invoke("dialog:openFile"),
  switchWindowSize: () => ipcRenderer.invoke("window:switchSize"),
  closeWindow: () => ipcRenderer.invoke("window:close"),
  loadSetting: () => ipcRenderer.invoke("setting:load"),
  saveSetting: (setting: SettingType) =>
    ipcRenderer.invoke("setting:save", setting),
  loadWindowColor: () => ipcRenderer.invoke("window_color:load"),
  saveWindowColor: (color: string) =>
    ipcRenderer.invoke("window_color:save", color),
});
