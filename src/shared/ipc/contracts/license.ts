import type { LicenseInfo } from "../../types/LicenseInfo";
import { defineInvokeContract, type InvokeContract } from "../contract";
import { IPC_CHANNELS } from "../channels";

/**
 * ライセンス情報取得関連のIPC通信におけるRequest/Responseの型定義群
 */
export type LicenseInvokeContracts = {
    get: InvokeContract<[], LicenseInfo[]>;
    appVersion: InvokeContract<[], string>;
};

/** ライセンス情報取得関連IPC通信の契約定義オブジェクト */
export const licenseIpcContracts: LicenseInvokeContracts = {
    get: defineInvokeContract(IPC_CHANNELS.license.get),
    appVersion: defineInvokeContract(IPC_CHANNELS.license.appVersion),
};
