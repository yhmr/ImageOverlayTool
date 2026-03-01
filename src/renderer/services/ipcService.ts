/**
 * IPC通信を抽象化するサービスレイヤー
 * window.electronAPIへのアクセスをラップし、テスト時のモック化を容易にする
 */

import { createCaptureIPCService } from "./ipc/capture";
import { createImageSettingsWindowIPCService } from "./ipc/imageSettingsWindow";
import { createLicenseIPCService } from "./ipc/license";
import { createLogIPCService } from "./ipc/log";
import { createProjectIPCService } from "./ipc/project";
import { createSettingsIPCService } from "./ipc/settings";
import { createSyncIPCService } from "./ipc/sync";
import { createWindowIPCService } from "./ipc/window";
import type { Unit } from "../../shared/ipc/electronApi";

export type IIPCService = ReturnType<typeof createLogIPCService> &
    ReturnType<typeof createWindowIPCService> &
    ReturnType<typeof createSettingsIPCService> &
    ReturnType<typeof createProjectIPCService> &
    ReturnType<typeof createImageSettingsWindowIPCService> &
    ReturnType<typeof createSyncIPCService> &
    ReturnType<typeof createLicenseIPCService> &
    ReturnType<typeof createCaptureIPCService>;
export type IProjectDataSyncIPCService = Pick<
    IIPCService,
    | "updateImageSets"
    | "updateDimensionLines"
    | "updateUnitFactor"
    | "updateUnit"
>;

export type { Unit };

const createIPCService = (): IIPCService => ({
    ...createLogIPCService(),
    ...createWindowIPCService(),
    ...createSettingsIPCService(),
    ...createProjectIPCService(),
    ...createImageSettingsWindowIPCService(),
    ...createSyncIPCService(),
    ...createLicenseIPCService(),
    ...createCaptureIPCService(),
});

// デフォルトのサービスインスタンス
let ipcServiceInstance: IIPCService = createIPCService();

/**
 * 現在のIPCサービスインスタンスを取得
 */
export const getIPCService = (): IIPCService => ipcServiceInstance;

/**
 * IPCサービスインスタンスを設定（テスト用）
 */
export const setIPCService = (service: IIPCService): void => {
    ipcServiceInstance = service;
};

/**
 * IPCサービスをデフォルトにリセット
 */
export const resetIPCService = (): void => {
    ipcServiceInstance = createIPCService();
};
