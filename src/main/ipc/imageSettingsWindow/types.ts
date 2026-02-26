import type {
    IDimensionSettingsWindowController,
    IImageSettingsWindowController,
    IProjectDirtyStateController,
    IWindowCollectionProvider,
} from "../../windows/windowManager";

/**
 * 画像設定・同期周りのIPCハンドラーが要求する、各種ウィンドウ操作や
 * プロジェクト状態管理コントローラーの依存関係の合成(Intersection)型
 */
export type ImageSettingsWindowHandlerDependencies =
    IImageSettingsWindowController &
        IDimensionSettingsWindowController &
        IWindowCollectionProvider &
        IProjectDirtyStateController;
