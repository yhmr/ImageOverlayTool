import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { syncUnitFactor } from "../store/projectSlice";
import { syncImageSets } from "../store/imageSetsSlice";
import { RootState } from "../store/store";

/**
 * アプリケーション状態の同期を行うフック
 * IPC経由で変更を受信し、Reduxストアを更新する
 */
export const useProjectSync = () => {
    const dispatch = useDispatch();
    // 状態送信のためにStateを取得
    const imageSetsState = useSelector((state: RootState) => state.imageSets);
    const projectState = useSelector((state: RootState) => state.project);

    useEffect(() => {
        // unit_factorの更新監視
        const unsubscribeUnitFactor = window.electronAPI.onUnitFactorUpdated((unitFactor) => {
            dispatch(syncUnitFactor(unitFactor));
        });

        // imageSetsの更新監視
        const unsubscribeImageSets = window.electronAPI.onImageSetsUpdated((imageSets) => {
            dispatch(syncImageSets(imageSets));
        });

        // 初期状態同期要求の監視 (メインウィンドウが応答する側)
        const unsubscribeRequestSync = window.electronAPI.onRequestStateSync(() => {
            // 現在の状態を送信
            window.electronAPI.updateImageSets(imageSetsState.imageSets);
            window.electronAPI.updateUnitFactor(projectState.unit_factor);
        });

        return () => {
            unsubscribeUnitFactor();
            unsubscribeImageSets();
            unsubscribeRequestSync();
        };
    }, [dispatch, imageSetsState, projectState]);
};
