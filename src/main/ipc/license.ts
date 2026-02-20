import { ipcMain, app } from "electron";
import * as fs from "fs";
import * as path from "path";
import log from "../logger";
import type { LicenseInfo } from "../../shared/types/LicenseInfo";
import { IPC_CHANNELS } from "../../shared/ipc/channels";

const getLicensePathCandidates = (): string[] => {
    if (!app.isPackaged) {
        return [path.join(app.getAppPath(), "licenses.json")];
    }

    return [
        path.join(process.resourcesPath, "licenses.json"),
        path.join(path.dirname(process.execPath), "licenses.json"),
    ];
};

/**
 * ライセンス情報取得用IPCハンドラを登録
 */
export function registerLicenseIpc(): void {
    ipcMain.handle(IPC_CHANNELS.license.appVersion, (): string => {
        return app.getVersion();
    });

    ipcMain.handle(
        IPC_CHANNELS.license.get,
        async (): Promise<LicenseInfo[]> => {
            try {
                const candidates = getLicensePathCandidates();
                const licensePath = candidates.find((candidate) =>
                    fs.existsSync(candidate)
                );

                if (!licensePath) {
                    log.warn(
                        `[main] License file not found. checked=${candidates.join(
                            ", "
                        )}`
                    );
                    return [];
                }

                log.debug(`[main] Loading license info from: ${licensePath}`);
                const content = fs.readFileSync(licensePath, "utf-8");
                const licenses: LicenseInfo[] = JSON.parse(content);
                log.info(`[main] Loaded ${licenses.length} license entries`);
                return licenses;
            } catch (error) {
                log.error(`[main] Failed to load license info:`, error);
                return [];
            }
        }
    );
}
