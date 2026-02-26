import type {
    EventArgs,
    EventContract,
    InvokeArgs,
    InvokeContract,
    InvokeResult,
} from "./contract";
import {
    appEventContracts,
    captureIpcContracts,
    e2eIpcContracts,
    dimensionSettingsWindowIpcContracts,
    imageSettingsWindowIpcContracts,
    licenseIpcContracts,
    logIpcContracts,
    projectIpcContracts,
    sceneIpcContracts,
    settingsEventContracts,
    settingsIpcContracts,
    syncEventContracts,
    syncIpcContracts,
    windowIpcContracts,
} from "./contracts";
import type {
    MaterializeCacheImagesPayload,
    SaveProjectPayload,
} from "./contracts/project";
import type { Unit as SyncUnit } from "./contracts/sync";

type InvokeMethod<TContract extends InvokeContract<unknown[], unknown>> = (
    ...args: InvokeArgs<TContract>
) => Promise<InvokeResult<TContract>>;

type EventMethod<TContract extends EventContract<unknown[]>> = (
    callback: (...args: EventArgs<TContract>) => void
) => () => void;

type FileOpenPayload = EventArgs<typeof appEventContracts.fileOpen>[0];
type LogWriteArgs = InvokeArgs<typeof logIpcContracts.write>;
type LogMessage = LogWriteArgs[1];
type LogParams = LogWriteArgs[2];

export type Unit = SyncUnit;

/**
 * メインプロセスからレンダラープロセスに公開される API (contextBridge 経由) の全体インターフェース。
 * window.electronAPI としてアクセス可能な全メソッドの型情報を定義します。
 */
export interface IElectronAPI {
    log: {
        debug: (message: LogMessage, ...params: LogParams) => Promise<void>;
        info: (message: LogMessage, ...params: LogParams) => Promise<void>;
        warn: (message: LogMessage, ...params: LogParams) => Promise<void>;
        error: (message: LogMessage, ...params: LogParams) => Promise<void>;
        export: InvokeMethod<typeof logIpcContracts.export>;
    };
    minimizeWindow: InvokeMethod<typeof windowIpcContracts.minimize>;
    switchWindowSize: InvokeMethod<typeof windowIpcContracts.switchSize>;
    setWindowRect: InvokeMethod<typeof windowIpcContracts.setRect>;
    showConfirmDialog: InvokeMethod<typeof windowIpcContracts.confirm>;
    setIgnoreMouseEvents: InvokeMethod<
        typeof windowIpcContracts.setIgnoreMouseEvents
    >;
    setAlwaysOnTop: InvokeMethod<typeof windowIpcContracts.setAlwaysOnTop>;
    closeWindow: InvokeMethod<typeof windowIpcContracts.close>;
    loadSetting: InvokeMethod<typeof settingsIpcContracts.load>;
    saveSetting: InvokeMethod<typeof settingsIpcContracts.save>;
    exportSettings: InvokeMethod<typeof settingsIpcContracts.export>;
    importSettings: InvokeMethod<typeof settingsIpcContracts.import>;
    onLanguageUpdated: EventMethod<
        typeof settingsEventContracts.languageUpdated
    >;
    onAlwaysOnTopShortcutTriggered: EventMethod<
        typeof settingsEventContracts.alwaysOnTopShortcutTriggered
    >;
    onClickThroughShortcutTriggered: EventMethod<
        typeof settingsEventContracts.clickThroughShortcutTriggered
    >;
    loadWindowColor: InvokeMethod<typeof settingsIpcContracts.windowColorLoad>;
    saveWindowColor: InvokeMethod<typeof settingsIpcContracts.windowColorSave>;
    loadWindowColorPresets: InvokeMethod<
        typeof settingsIpcContracts.windowColorPresetsLoad
    >;
    saveWindowColorPresets: InvokeMethod<
        typeof settingsIpcContracts.windowColorPresetsSave
    >;
    saveProjectAs: InvokeMethod<typeof projectIpcContracts.saveAs>;
    saveProject: (
        filePath: SaveProjectPayload["filePath"],
        project: SaveProjectPayload["project"],
        cacheImagePathsToDelete?: SaveProjectPayload["cacheImagePathsToDelete"]
    ) => Promise<InvokeResult<typeof projectIpcContracts.save>>;
    pickProjectSavePath: InvokeMethod<typeof projectIpcContracts.pickSavePath>;
    materializeCacheImages: (
        projectFilePath: MaterializeCacheImagesPayload["projectFilePath"],
        cacheImagePaths: MaterializeCacheImagesPayload["cacheImagePaths"]
    ) => Promise<
        InvokeResult<typeof projectIpcContracts.materializeCacheImages>
    >;
    loadProject: InvokeMethod<typeof projectIpcContracts.load>;
    loadProjectFromPath: InvokeMethod<typeof projectIpcContracts.loadFromPath>;
    loadSceneFromPath: InvokeMethod<typeof sceneIpcContracts.loadFromPath>;
    loadImage: InvokeMethod<typeof imageSettingsWindowIpcContracts.loadImage>;
    getImageInfo: InvokeMethod<
        typeof imageSettingsWindowIpcContracts.getImageInfo
    >;
    pasteImage: InvokeMethod<typeof imageSettingsWindowIpcContracts.pasteImage>;
    saveCacheImageAs: InvokeMethod<
        typeof imageSettingsWindowIpcContracts.saveCacheImageAs
    >;
    getPathForFile: (file: File) => string;
    toggleImageSettingsWindow: InvokeMethod<
        typeof imageSettingsWindowIpcContracts.toggle
    >;
    toggleDimensionSettingsWindow: InvokeMethod<
        typeof dimensionSettingsWindowIpcContracts.toggle
    >;
    updateImageSets: InvokeMethod<typeof syncIpcContracts.updateImageSets>;
    onImageSetsUpdated: EventMethod<typeof syncEventContracts.imageSetsUpdated>;
    updateDimensionLines: InvokeMethod<
        typeof syncIpcContracts.updateDimensionLines
    >;
    onDimensionLinesUpdated: EventMethod<
        typeof syncEventContracts.dimensionLinesUpdated
    >;
    updateUnit: InvokeMethod<typeof syncIpcContracts.updateUnit>;
    onUnitUpdated: EventMethod<typeof syncEventContracts.unitUpdated>;
    updateInteractionMode: InvokeMethod<
        typeof syncIpcContracts.updateInteractionMode
    >;
    onInteractionModeUpdated: EventMethod<
        typeof syncEventContracts.interactionModeUpdated
    >;
    updateUnitFactor: InvokeMethod<typeof syncIpcContracts.updateUnitFactor>;
    onUnitFactorUpdated: EventMethod<
        typeof syncEventContracts.unitFactorUpdated
    >;
    updateSelectedImageId: InvokeMethod<
        typeof syncIpcContracts.updateSelectedImageId
    >;
    onSelectedImageIdUpdated: EventMethod<
        typeof syncEventContracts.selectedImageIdUpdated
    >;
    updateSelectedDimensionLineId: InvokeMethod<
        typeof syncIpcContracts.updateSelectedDimensionLineId
    >;
    onSelectedDimensionLineIdUpdated: EventMethod<
        typeof syncEventContracts.selectedDimensionLineIdUpdated
    >;
    updateProjectDirty: InvokeMethod<
        typeof syncIpcContracts.updateProjectDirty
    >;
    requestInitialState: InvokeMethod<
        typeof syncIpcContracts.requestInitialState
    >;
    onRequestStateSync: EventMethod<typeof syncEventContracts.requestStateSync>;
    onFileOpen: (
        callback: (
            filePath: FileOpenPayload["filePath"],
            ext: FileOpenPayload["ext"]
        ) => void
    ) => () => void;
    getLicenseInfo: InvokeMethod<typeof licenseIpcContracts.get>;
    getAppVersion: InvokeMethod<typeof licenseIpcContracts.appVersion>;
    captureScreen: InvokeMethod<typeof captureIpcContracts.screen>;
    captureWindow: InvokeMethod<typeof captureIpcContracts.window>;
    saveImage: InvokeMethod<typeof captureIpcContracts.saveImageData>;
    getE2EStatus: InvokeMethod<typeof e2eIpcContracts.getStatus>;
    e2eSetSceneFromPath: InvokeMethod<typeof e2eIpcContracts.setSceneFromPath>;
    e2eLoadFixtureImage: InvokeMethod<typeof e2eIpcContracts.loadFixtureImage>;
    e2eWaitStable: InvokeMethod<typeof e2eIpcContracts.waitStable>;
    e2eCapture: InvokeMethod<typeof e2eIpcContracts.capture>;
}
