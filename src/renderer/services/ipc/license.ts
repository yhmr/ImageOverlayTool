import { getElectronApi } from "./electronApi";
import type { ILicenseIPCService } from "./types";

export const createLicenseIPCService = (): ILicenseIPCService => ({
    getLicenseInfo: () => getElectronApi().getLicenseInfo(),
    getAppVersion: () => getElectronApi().getAppVersion(),
});
