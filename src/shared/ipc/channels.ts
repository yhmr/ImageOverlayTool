export const IPC_CHANNELS = {
    log: {
        write: "log:write",
        export: "log:export",
    },
    window: {
        switchSize: "window:switchSize",
        close: "window:close",
        setRect: "window:setRect",
        setIgnoreMouseEvents: "window:setIgnoreMouseEvents",
        setAlwaysOnTop: "window:setAlwaysOnTop",
    },
    setting: {
        load: "setting:load",
        save: "setting:save",
        export: "setting:export",
        import: "setting:import",
        windowColorLoad: "window_color:load",
        windowColorSave: "window_color:save",
    },
    project: {
        saveAs: "project:saveAs",
        save: "project:save",
        load: "project:load",
        loadFromPath: "project:loadFromPath",
    },
    imageSettingsWindow: {
        toggle: "imageSettingsWindow:toggle",
        loadImage: "image:load",
    },
    sync: {
        updateImageSets: "imageSets:update",
        updateUnitFactor: "unitFactor:update",
        updateUnit: "unit:update",
        updateSelectedImageId: "selectedImageId:update",
        updateProjectDirty: "project:dirty:update",
        requestInitialState: "state:requestInitial",
    },
    license: {
        get: "license:get",
        appVersion: "app:getVersion",
    },
    capture: {
        screen: "capture-screen",
        window: "capture-window",
        saveImageData: "save-image-data",
    },
    e2e: {
        getStatus: "e2e:getStatus",
        setScene: "e2e:setScene",
        loadFixtureImage: "e2e:loadFixtureImage",
        waitStable: "e2e:waitStable",
        capture: "e2e:capture",
    },
} as const;

export const IPC_EVENTS = {
    imageSetsUpdated: "imageSets:updated",
    unitFactorUpdated: "unitFactor:updated",
    unitUpdated: "unit:updated",
    selectedImageIdUpdated: "selectedImageId:updated",
    languageUpdated: "language:updated",
    requestStateSync: "state:requestSync",
    fileOpen: "file:open",
} as const;
