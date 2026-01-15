import { useEffect } from "react";
import { useAppStore } from "../store/useAppStore";

/**
 * アプリケーション状態の同期を行うフック
 * IPC経由で変更を受信し、Zustandストアを更新する
 */
export const useProjectSync = () => {
    useEffect(() => {
        // unit_factorの更新監視
        const unsubscribeUnitFactor = window.electronAPI.onUnitFactorUpdated(
            (unitFactor) => {
                useAppStore.getState().syncUnitFactor(unitFactor);
            }
        );

        // imageSetsの更新監視
        const unsubscribeImageSets = window.electronAPI.onImageSetsUpdated(
            (imageSets) => {
                useAppStore.getState().syncImageSets(imageSets);
            }
        );

        // 初期状態同期要求の監視 (メインウィンドウが応答する側)
        const unsubscribeRequestSync = window.electronAPI.onRequestStateSync(
            () => {
                // 現在の状態を送信
                const currentImageSets = useAppStore.getState().imageSets;
                const currentUnitFactor = useAppStore.getState().unitFactor;

                window.electronAPI.updateImageSets(currentImageSets);
                window.electronAPI.updateUnitFactor(currentUnitFactor);
            }
        );

        return () => {
            unsubscribeUnitFactor();
            unsubscribeImageSets();
            unsubscribeRequestSync();
        };
    }, []);
};
