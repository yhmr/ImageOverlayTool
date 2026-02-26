import { contextBridge } from "electron";
import { createAppEventsApi } from "./ipc/appEvents";
import { createCaptureApi } from "./ipc/capture";
import { createE2EApi } from "./ipc/e2e";
import { createImageSettingsWindowApi } from "./ipc/imageSettingsWindow";
import { createLicenseApi } from "./ipc/license";
import { createLogApi } from "./ipc/log";
import { createProjectApi } from "./ipc/project";
import { createSettingsApi } from "./ipc/settings";
import { createSyncApi } from "./ipc/sync";
import { createWindowApi } from "./ipc/window";

/**
 * メインプロセスとレンダラープロセスの間にかかるブリッジ(contextBridge)の構築。
 * セキュリティを担保しつつ、レンダラープロセスに各種IPC通信APIを `window.electronAPI` として公開します。
 */
contextBridge.exposeInMainWorld("electronAPI", {
    ...createLogApi(),
    ...createWindowApi(),
    ...createSettingsApi(),
    ...createProjectApi(),
    ...createImageSettingsWindowApi(),
    ...createSyncApi(),
    ...createAppEventsApi(),
    ...createLicenseApi(),
    ...createCaptureApi(),
    ...createE2EApi(),
});
