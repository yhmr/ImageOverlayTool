import { getElectronApi } from "./electronApi";
import type { IElectronAPI } from "../../../shared/ipc/electronApi";

type LicenseIPCService = Pick<IElectronAPI, "getLicenseInfo" | "getAppVersion">;

export const createLicenseIPCService = (): LicenseIPCService => ({
    getLicenseInfo: () => getElectronApi().getLicenseInfo(),
    getAppVersion: () => getElectronApi().getAppVersion(),
});
