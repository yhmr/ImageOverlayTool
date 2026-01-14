import { Middleware } from "@reduxjs/toolkit";
import { ImageSet } from "../types/ImageSet";

/**
 * imageSetsの変更を検知してIPC送信を行うミドルウェア
 * syncImageSetsアクション（受信）の場合は送信しない
 */
// 循環参照回避のためRootStateを直接使わず、必要な型のみ定義
interface SyncState {
    imageSets: { imageSets: ImageSet[] };
    project: { unit_factor: number };
    [key: string]: unknown; // 他のプロパティを許容
}

export const syncMiddleware: Middleware<NonNullable<unknown>, SyncState> =
    (store) => (next) => (action) => {
        const result = next(action);

        // アクションの型チェック
        if (typeof action === "object" && action !== null && "type" in action) {
            const type = (action as { type: string }).type;

            // imageSetsの更新アクションかつ、同期アクションでない場合
            if (
                type.startsWith("imageSets/") &&
                type !== "imageSets/syncImageSets" // 受信アクションは除外
            ) {
                const state = store.getState();
                // IPC送信 (非同期だが待つ必要なし)
                window.electronAPI.updateImageSets(state.imageSets.imageSets);
            }

            // unit_factorの更新
            if (type === "project/setUnitFactor") {
                const state = store.getState();
                window.electronAPI.updateUnitFactor(state.project.unit_factor);
            }
        }

        return result;
    };
