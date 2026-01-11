import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { syncUnitFactor } from "../store/projectSlice";
import { syncImageSets } from "../store/imageSetsSlice";

/**
 * アプリケーション状態の同期を行うフック
 * IPC経由で変更を受信し、Reduxストアを更新する
 */
export const useProjectSync = () => {
    const dispatch = useDispatch();

    useEffect(() => {
        // unit_factorの更新監視
        const unsubscribeUnitFactor = window.electronAPI.onUnitFactorUpdated((unitFactor) => {
            dispatch(syncUnitFactor(unitFactor));
        });

        // imageSetsの更新監視
        const unsubscribeImageSets = window.electronAPI.onImageSetsUpdated((imageSets) => {
            dispatch(syncImageSets(imageSets));
        });

        return () => {
            unsubscribeUnitFactor();
            unsubscribeImageSets();
        };
    }, [dispatch]);
};
