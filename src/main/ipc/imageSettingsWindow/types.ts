import type {
    IDimensionSettingsWindowController,
    IImageSettingsWindowController,
    IProjectDirtyStateController,
    IWindowCollectionProvider,
} from "../../windows/windowManager";

export type ImageSettingsWindowHandlerDependencies =
    IImageSettingsWindowController &
        IDimensionSettingsWindowController &
        IWindowCollectionProvider &
        IProjectDirtyStateController;
