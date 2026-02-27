import type { E2ERuntimeConfig } from "../../e2e/runtimeConfig";
import type { CaptureTestModeOptions } from "../../services/captureService";

/** E2Eハンドラー登録時に受け取る初期化オプション */
export interface E2EControlRegistrationOptions {
    /** E2E実行時の構成設定 */
    e2eConfig: E2ERuntimeConfig;
}

/** E2Eコントロールのハンドラー群で共有されるコンテキスト情報やユーティリティ関数 */
export interface E2EControlHandlerContext {
    /** E2E実行時の構成設定 */
    e2eConfig: E2ERuntimeConfig;
    /** E2Eテスト用の画像パス解決に用いるエイリアス */
    e2eImagePathAliases: {
        fixtures: string;
    };
    /** キャプチャ時のテストモード(モック情報や書き出し先等) */
    captureTestMode: CaptureTestModeOptions;
    /** E2E機能が無効な場合の理由を返す関数 */
    getDisabledReason: () => string;
    /** E2E機能が有効かどうかを判定する関数 */
    isControlPlaneEnabled: () => boolean;
    /** E2E機能が無効な場合に例外をスローする関数 */
    assertControlPlaneEnabled: () => void;
}
