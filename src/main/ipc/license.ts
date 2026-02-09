import { ipcMain, app } from "electron";
import * as fs from "fs";
import * as path from "path";
import log from "../logger";
import type { LicenseInfo } from "../../shared/types/LicenseInfo";

/**
 * ライセンス情報取得用IPCハンドラを登録
 */
export function registerLicenseIpc(): void {
    // アプリバージョン取得
    ipcMain.handle("app:getVersion", (): string => {
        return app.getVersion();
    });

    // ライセンス情報取得
    ipcMain.handle("license:get", async (): Promise<LicenseInfo[]> => {
        try {
            // 開発時はプロジェクトルート、本番時はリソースパスからライセンスファイルを読み込む
            const licensePath = app.isPackaged
                ? path.join(process.resourcesPath, "licenses.json")
                : path.join(app.getAppPath(), "licenses.json");

            log.debug(`[main] Loading license info from: ${licensePath}`);

            if (!fs.existsSync(licensePath)) {
                log.warn(`[main] License file not found: ${licensePath}`);
                return [];
            }

            const content = fs.readFileSync(licensePath, "utf-8");
            const licenses: LicenseInfo[] = JSON.parse(content);
            log.info(`[main] Loaded ${licenses.length} license entries`);
            return licenses;
        } catch (error) {
            log.error(`[main] Failed to load license info:`, error);
            return [];
        }
    });
}
