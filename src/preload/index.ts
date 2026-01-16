import { contextBridge, ipcRenderer } from "electron";
import type { SettingType } from "../shared/types/AppConfig";

import type { ProjectFile } from "../shared/types/ProjectFile";
import type { ImageSet } from "../shared/types/ImageSet";

contextBridge.exposeInMainWorld("electronAPI", {
    // Logger
    log: {
        debug: (message: string, ...params: unknown[]) =>
            ipcRenderer.invoke("log:write", "debug", message, params),
        info: (message: string, ...params: unknown[]) =>
            ipcRenderer.invoke("log:write", "info", message, params),
        warn: (message: string, ...params: unknown[]) =>
            ipcRenderer.invoke("log:write", "warn", message, params),
        error: (message: string, ...params: unknown[]) =>
            ipcRenderer.invoke("log:write", "error", message, params),
    },
    // Window
    switchWindowSize: (): Promise<boolean> =>
        ipcRenderer.invoke("window:switchSize"),
    setWindowRect: (rect: {
        x: number;
        y: number;
        width: number;
        height: number;
    }) => ipcRenderer.invoke("window:setRect", rect),
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
    loadProjectFromPath: (filePath: string) =>
        ipcRenderer.invoke("project:loadFromPath", filePath),
    // Image Settings Window
    loadImage: () => ipcRenderer.invoke("image:load"),
    toggleImageSettingsWindow: () =>
        ipcRenderer.invoke("imageSettingsWindow:toggle"),
    // ImageSets Sync
    updateImageSets: (imageSets: ImageSet[]) =>
        ipcRenderer.invoke("imageSets:update", imageSets),
    onImageSetsUpdated: (callback: (imageSets: ImageSet[]) => void) => {
        const subscription = (_event: unknown, imageSets: ImageSet[]) =>
            callback(imageSets);
        ipcRenderer.on("imageSets:updated", subscription);
        return () =>
            ipcRenderer.removeListener("imageSets:updated", subscription);
    },
    // Unit Factor Sync
    updateUnitFactor: (unitFactor: number) =>
        ipcRenderer.invoke("unitFactor:update", unitFactor),
    onUnitFactorUpdated: (callback: (unitFactor: number) => void) => {
        const subscription = (_event: unknown, unitFactor: number) =>
            callback(unitFactor);
        ipcRenderer.on("unitFactor:updated", subscription);
        return () =>
            ipcRenderer.removeListener("unitFactor:updated", subscription);
    },
    // Initial State Sync
    requestInitialState: () => ipcRenderer.invoke("state:requestInitial"),
    onRequestStateSync: (callback: () => void) => {
        const subscription = () => callback();
        ipcRenderer.on("state:requestSync", subscription);
        return () =>
            ipcRenderer.removeListener("state:requestSync", subscription);
    },
    // File Open (Startup/DragDrop)
    onFileOpen: (callback: (filePath: string, ext: string) => void) => {
        const subscription = (
            _event: unknown,
            { filePath, ext }: { filePath: string; ext: string }
        ) => callback(filePath, ext);
        ipcRenderer.on("file:open", subscription);
        return () => ipcRenderer.removeListener("file:open", subscription);
    },
    // License
    getLicenseInfo: () => ipcRenderer.invoke("license:get"),
});
