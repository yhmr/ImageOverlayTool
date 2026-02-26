import { licenseIpcContracts } from "../../shared/ipc/contracts";
import { invokeIpcContract } from "./client";

/**
 * ライセンスおよびアプリバージョン情報に関するIPC通信APIの構築関数
 */
export const createLicenseApi = () => ({
    getLicenseInfo: () => invokeIpcContract(licenseIpcContracts.get),
    getAppVersion: () => invokeIpcContract(licenseIpcContracts.appVersion),
});
