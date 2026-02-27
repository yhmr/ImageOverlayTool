import { getElectronApi } from "./electronApi";
import type { IElectronAPI } from "../../../shared/ipc/electronApi";

/**
 * レンダラープロセス内でライセンス情報取得通信を担うサービスのインターフェース
 */
type LicenseIPCService = Pick<IElectronAPI, "getLicenseInfo" | "getAppVersion">;

/**
 * ライセンス情報取得IPC通信サービスを生成して返します。
 */
export const createLicenseIPCService = (): LicenseIPCService => ({
    getLicenseInfo: () => getElectronApi().getLicenseInfo(),
    getAppVersion: () => getElectronApi().getAppVersion(),
});
