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
                type !== "imageSets/syncImageSets" && // 受信アクションは除外
                type !== "imageSets/setAllImageSets" // ロード時の一括設定も除外するか検討（同期したいなら含める）
            ) {
                // ロード時の一括設定も同期すべきかどうか？
                // プロジェクトを開いた場合は同期したいはず。
                // ただし loadProject 内でどう処理されるかによる。
                // いったん、ユーザー操作による変更（add, update, set(D&D)）は確実に同期。

                // setAllImageSets も同期対象にする
                // ただし無限ループしないように、受信側は syncImageSets を使うこと。

                const state = store.getState();
                // IPC送信 (非同期だが待つ必要なし)
                window.electronAPI.updateImageSets(state.imageSets.imageSets);
            }

            // setAllImageSets も同期対象に含める場合（プロジェクトロード時など）
            if (type === "imageSets/setAllImageSets") {
                const state = store.getState();
                window.electronAPI.updateImageSets(state.imageSets.imageSets);
            }
        }

        return result;
    };
