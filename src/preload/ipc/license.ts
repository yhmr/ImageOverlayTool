import { IPC_CHANNELS } from "../../shared/ipc/channels";
import { invokeIpc } from "./client";

export const createLicenseApi = () => ({
    getLicenseInfo: () => invokeIpc(IPC_CHANNELS.license.get),
    getAppVersion: () => invokeIpc<string>(IPC_CHANNELS.license.appVersion),
});
