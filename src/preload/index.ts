import { contextBridge, ipcRenderer, webUtils } from "electron";
import type { SettingType } from "../shared/types/AppConfig";

import type { ProjectFile } from "../shared/types/ProjectFile";
import type { ImageSet } from "../shared/types/ImageSet";
import { IPC_CHANNELS, IPC_EVENTS } from "../shared/ipc/channels";
import type {
    E2ECaptureRequest,
    E2EControlStatus,
    E2ELoadFixtureImageRequest,
    E2EResolvedFixtureImage,
    E2EResolvedScene,
    E2ESceneInput,
    E2EWaitStableRequest,
    E2EWaitStableResult,
} from "../shared/types/E2EControl";

contextBridge.exposeInMainWorld("electronAPI", {
    // Logger
    log: {
        debug: (message: string, ...params: unknown[]) =>
            ipcRenderer.invoke(
                IPC_CHANNELS.log.write,
                "debug",
                message,
                params
            ),
        info: (message: string, ...params: unknown[]) =>
            ipcRenderer.invoke(IPC_CHANNELS.log.write, "info", message, params),
        warn: (message: string, ...params: unknown[]) =>
            ipcRenderer.invoke(IPC_CHANNELS.log.write, "warn", message, params),
        error: (message: string, ...params: unknown[]) =>
            ipcRenderer.invoke(
                IPC_CHANNELS.log.write,
                "error",
                message,
                params
            ),
        export: () => ipcRenderer.invoke(IPC_CHANNELS.log.export),
    },
    // Window
    switchWindowSize: (): Promise<boolean> =>
        ipcRenderer.invoke(IPC_CHANNELS.window.switchSize),
    setWindowRect: (rect: {
        x: number;
        y: number;
        width: number;
        height: number;
    }) => ipcRenderer.invoke(IPC_CHANNELS.window.setRect, rect),
    setIgnoreMouseEvents: (ignore: boolean) =>
        ipcRenderer.invoke(IPC_CHANNELS.window.setIgnoreMouseEvents, ignore),
    setAlwaysOnTop: (enabled: boolean) =>
        ipcRenderer.invoke(IPC_CHANNELS.window.setAlwaysOnTop, enabled),
    closeWindow: () => ipcRenderer.invoke(IPC_CHANNELS.window.close),
    // Setting
    loadSetting: () => ipcRenderer.invoke(IPC_CHANNELS.setting.load),
    saveSetting: (setting: SettingType) =>
        ipcRenderer.invoke(IPC_CHANNELS.setting.save, setting),
    exportSettings: () => ipcRenderer.invoke(IPC_CHANNELS.setting.export),
    importSettings: () => ipcRenderer.invoke(IPC_CHANNELS.setting.import),
    onLanguageUpdated: (callback: (language: string) => void) => {
        const subscription = (_event: unknown, language: string) =>
            callback(language);
        ipcRenderer.on(IPC_EVENTS.languageUpdated, subscription);
        return () =>
            ipcRenderer.removeListener(
                IPC_EVENTS.languageUpdated,
                subscription
            );
    },
    // Window Color
    loadWindowColor: () =>
        ipcRenderer.invoke(IPC_CHANNELS.setting.windowColorLoad),
    saveWindowColor: (color: string) =>
        ipcRenderer.invoke(IPC_CHANNELS.setting.windowColorSave, color),
    // Project
    saveProjectAs: (project: ProjectFile) =>
        ipcRenderer.invoke(IPC_CHANNELS.project.saveAs, project),
    saveProject: (filePath: string, project: ProjectFile) =>
        ipcRenderer.invoke(IPC_CHANNELS.project.save, { filePath, project }),
    pickProjectSavePath: () =>
        ipcRenderer.invoke(IPC_CHANNELS.project.pickSavePath),
    materializeCacheImages: (
        projectFilePath: string,
        cacheImagePaths: string[]
    ): Promise<Record<string, string>> =>
        ipcRenderer.invoke(IPC_CHANNELS.project.materializeCacheImages, {
            projectFilePath,
            cacheImagePaths,
        }),
    loadProject: () => ipcRenderer.invoke(IPC_CHANNELS.project.load),
    loadProjectFromPath: (filePath: string) =>
        ipcRenderer.invoke(IPC_CHANNELS.project.loadFromPath, filePath),
    // Image Settings Window
    loadImage: () =>
        ipcRenderer.invoke(IPC_CHANNELS.imageSettingsWindow.loadImage),
    pasteImage: (): Promise<string | null> =>
        ipcRenderer.invoke(IPC_CHANNELS.imageSettingsWindow.pasteImage),
    saveCacheImageAs: (cacheFilePath: string): Promise<string | null> =>
        ipcRenderer.invoke(
            IPC_CHANNELS.imageSettingsWindow.saveCacheImageAs,
            cacheFilePath
        ),
    getPathForFile: (file: File) => webUtils.getPathForFile(file),
    toggleImageSettingsWindow: () =>
        ipcRenderer.invoke(IPC_CHANNELS.imageSettingsWindow.toggle),
    // ImageSets Sync
    updateImageSets: (imageSets: ImageSet[]) =>
        ipcRenderer.invoke(IPC_CHANNELS.sync.updateImageSets, imageSets),
    onImageSetsUpdated: (callback: (imageSets: ImageSet[]) => void) => {
        const subscription = (_event: unknown, imageSets: ImageSet[]) =>
            callback(imageSets);
        ipcRenderer.on(IPC_EVENTS.imageSetsUpdated, subscription);
        return () =>
            ipcRenderer.removeListener(
                IPC_EVENTS.imageSetsUpdated,
                subscription
            );
    },
    // Unit sync
    updateUnit: (unit: "nm" | "um" | "mm") =>
        ipcRenderer.invoke(IPC_CHANNELS.sync.updateUnit, unit),
    onUnitUpdated: (callback: (unit: "nm" | "um" | "mm") => void) => {
        const subscription = (_event: unknown, unit: "nm" | "um" | "mm") =>
            callback(unit);
        ipcRenderer.on(IPC_EVENTS.unitUpdated, subscription);
        return () =>
            ipcRenderer.removeListener(IPC_EVENTS.unitUpdated, subscription);
    },
    // Unit Factor Sync
    updateUnitFactor: (unitFactor: number) =>
        ipcRenderer.invoke(IPC_CHANNELS.sync.updateUnitFactor, unitFactor),
    onUnitFactorUpdated: (callback: (unitFactor: number) => void) => {
        const subscription = (_event: unknown, unitFactor: number) =>
            callback(unitFactor);
        ipcRenderer.on(IPC_EVENTS.unitFactorUpdated, subscription);
        return () =>
            ipcRenderer.removeListener(
                IPC_EVENTS.unitFactorUpdated,
                subscription
            );
    },
    // Selected Image Sync
    updateSelectedImageId: (id: string | null) =>
        ipcRenderer.invoke(IPC_CHANNELS.sync.updateSelectedImageId, id),
    onSelectedImageIdUpdated: (callback: (id: string | null) => void) => {
        const subscription = (_event: unknown, id: string | null) =>
            callback(id);
        ipcRenderer.on(IPC_EVENTS.selectedImageIdUpdated, subscription);
        return () =>
            ipcRenderer.removeListener(
                IPC_EVENTS.selectedImageIdUpdated,
                subscription
            );
    },
    // Project Dirty Sync
    updateProjectDirty: (isDirty: boolean) =>
        ipcRenderer.invoke(IPC_CHANNELS.sync.updateProjectDirty, isDirty),
    // Initial State Sync
    requestInitialState: () =>
        ipcRenderer.invoke(IPC_CHANNELS.sync.requestInitialState),
    onRequestStateSync: (callback: () => void) => {
        const subscription = () => callback();
        ipcRenderer.on(IPC_EVENTS.requestStateSync, subscription);
        return () =>
            ipcRenderer.removeListener(
                IPC_EVENTS.requestStateSync,
                subscription
            );
    },
    // File Open (Startup/DragDrop)
    onFileOpen: (callback: (filePath: string, ext: string) => void) => {
        const subscription = (
            _event: unknown,
            { filePath, ext }: { filePath: string; ext: string }
        ) => callback(filePath, ext);
        ipcRenderer.on(IPC_EVENTS.fileOpen, subscription);
        return () =>
            ipcRenderer.removeListener(IPC_EVENTS.fileOpen, subscription);
    },
    // License
    getLicenseInfo: () => ipcRenderer.invoke(IPC_CHANNELS.license.get),
    // App Version
    getAppVersion: () => ipcRenderer.invoke(IPC_CHANNELS.license.appVersion),
    // Capture
    captureScreen: () => ipcRenderer.invoke(IPC_CHANNELS.capture.screen),
    captureWindow: () => ipcRenderer.invoke(IPC_CHANNELS.capture.window),
    saveImage: (dataUrl: string) =>
        ipcRenderer.invoke(IPC_CHANNELS.capture.saveImageData, dataUrl),
    // E2E control plane
    getE2EStatus: (): Promise<E2EControlStatus> =>
        ipcRenderer.invoke(IPC_CHANNELS.e2e.getStatus),
    e2eSetScene: (scene: E2ESceneInput): Promise<E2EResolvedScene> =>
        ipcRenderer.invoke(IPC_CHANNELS.e2e.setScene, scene),
    e2eLoadFixtureImage: (
        request: E2ELoadFixtureImageRequest
    ): Promise<E2EResolvedFixtureImage> =>
        ipcRenderer.invoke(IPC_CHANNELS.e2e.loadFixtureImage, request),
    e2eWaitStable: (
        request?: E2EWaitStableRequest
    ): Promise<E2EWaitStableResult> =>
        ipcRenderer.invoke(IPC_CHANNELS.e2e.waitStable, request),
    e2eCapture: (request?: E2ECaptureRequest) =>
        ipcRenderer.invoke(IPC_CHANNELS.e2e.capture, request),
});
