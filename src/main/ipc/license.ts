import { ipcMain, app } from "electron";
import * as fs from "fs";
import * as path from "path";
import log from "../logger";
import type { LicenseInfo } from "../../shared/types/LicenseInfo";
import { licenseIpcContracts } from "../../shared/ipc/contracts";

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
 * アプリのバージョン取得や、licenses.jsonからのオープンソースライセンス一覧取得など、
 * ライセンスに関する情報の提供を担うIPCハンドラーを登録します。
 */
export function registerLicenseIpc(): void {
    ipcMain.handle(licenseIpcContracts.appVersion.channel, (): string => {
        return app.getVersion();
    });

    ipcMain.handle(
        licenseIpcContracts.get.channel,
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
