import path from "path";

import type { E2ERuntimeConfig } from "../e2e/runtimeConfig";
import { registerE2ECaptureHandlers } from "./e2eControl/captureHandlers";
import { registerE2ESceneHandlers } from "./e2eControl/sceneHandlers";
import { registerE2EStatusHandlers } from "./e2eControl/statusHandlers";
import type {
    E2EControlHandlerContext,
    E2EControlRegistrationOptions,
} from "./e2eControl/types";

const getDisabledReason = (e2eConfig: E2ERuntimeConfig): string => {
    if (!e2eConfig.enabled) {
        return 'E2E control plane is disabled because "--e2e" is not enabled.';
    }
    if (process.env.IOT_E2E_MODE !== "1") {
        return "E2E control plane is disabled because IOT_E2E_MODE is not enabled.";
    }
    return "";
};

const isControlPlaneEnabled = (e2eConfig: E2ERuntimeConfig): boolean => {
    return getDisabledReason(e2eConfig).length === 0;
};

const assertControlPlaneEnabled = (e2eConfig: E2ERuntimeConfig): void => {
    const reason = getDisabledReason(e2eConfig);
    if (reason.length > 0) {
        throw new Error(reason);
    }
};

/**
 * E2Eテスト用の制御を行うIPCハンドラーを登録します。
 *
 * 状態確認、シーン設定、キャプチャ機能の各エンドポイントを構築します。
 * E2E機能が有効化されていない場合は、各ハンドラーの呼び出しでエラーをスローします。
 *
 * @param options E2E実行時の設定を含むオプション
 */
export const registerE2EControlHandlers = ({
    e2eConfig,
}: E2EControlRegistrationOptions): void => {
    const context: E2EControlHandlerContext = {
        e2eConfig,
        e2eImagePathAliases: {
            fixtures: path.resolve(e2eConfig.fixturesDir, "images"),
        },
        captureTestMode: {
            enabled: true,
            captureFilePath: e2eConfig.captureFilePath,
            exportImagePath: e2eConfig.exportImagePath,
            fixedNow: e2eConfig.fixedNow,
        },
        getDisabledReason: () => getDisabledReason(e2eConfig),
        isControlPlaneEnabled: () => isControlPlaneEnabled(e2eConfig),
        assertControlPlaneEnabled: () => assertControlPlaneEnabled(e2eConfig),
    };

    registerE2EStatusHandlers(context);
    registerE2ESceneHandlers(context);
    registerE2ECaptureHandlers(context);
};
