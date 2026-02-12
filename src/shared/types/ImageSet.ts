import { AnchorPos } from "./AnchorPos";

/**
 * 画像セットの型
 * 1つの画像とその変形パラメータを定義する
 */
export interface ImageSet {
    /** 画像の一意識別子 */
    id: string;
    /** 画像ファイルパス */
    path: string;
    /** 透過度 (0-100) */
    transparency: number;
    /** 回転角度 (度) */
    rotation: number;
    /** アンカー初期ポジション */
    initAnchorPos: AnchorPos | null;
    /** アンカー現在のポジション */
    currentAnchorPos: AnchorPos | null;
    /** ロック状態 */
    locked?: boolean;
    /** 表示状態 */
    visible?: boolean;
    /** フィルタ設定 */
    filters?: {
        binarization?: {
            enabled: boolean;
            threshold: number;
        };
        hsv?: {
            enabled: boolean;
            h: number;
            s: number;
            v: number;
        };
    };
}
