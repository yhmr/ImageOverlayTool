import { Middleware } from "@reduxjs/toolkit";
import { RootState } from "./store";

/**
 * imageSetsの変更を検知してIPC送信を行うミドルウェア
 * syncImageSetsアクション（受信）の場合は送信しない
 */
export const syncMiddleware: Middleware<NonNullable<unknown>, RootState> =
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
        }

        return result;
    };
