import type { LicenseInfo } from "../../types/LicenseInfo";
import { defineInvokeContract, type InvokeContract } from "../contract";
import { IPC_CHANNELS } from "../channels";

export type LicenseInvokeContracts = {
    get: InvokeContract<[], LicenseInfo[]>;
    appVersion: InvokeContract<[], string>;
};

export const licenseIpcContracts: LicenseInvokeContracts = {
    get: defineInvokeContract(IPC_CHANNELS.license.get),
    appVersion: defineInvokeContract(IPC_CHANNELS.license.appVersion),
};
