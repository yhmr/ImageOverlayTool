import { licenseIpcContracts } from "../../shared/ipc/contracts";
import { invokeIpcContract } from "./client";

export const createLicenseApi = () => ({
    getLicenseInfo: () => invokeIpcContract(licenseIpcContracts.get),
    getAppVersion: () => invokeIpcContract(licenseIpcContracts.appVersion),
});
