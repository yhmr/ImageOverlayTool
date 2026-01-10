import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { syncImageSets } from "../store/imageSetsSlice";
import { AppDispatch } from "../store/store";

/**
 * 他ウィンドウからのimageSets同期イベントを受信するフック
 */
export const useImageSetsSync = () => {
    const dispatch = useDispatch<AppDispatch>();

    useEffect(() => {
        // IPCからの更新通知を受信
        const removeListener = window.electronAPI.onImageSetsUpdated((imageSets) => {
            // 受信データをストアに反映（同期専用アクションを使用）
            dispatch(syncImageSets(imageSets));
        });

        return () => {
            removeListener();
        };
    }, [dispatch]);
};
