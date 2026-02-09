import { useEffect } from "react";
import { useAppStore } from "../store/useAppStore";
import { getIPCService } from "../services/ipcService";

/**
 * アプリケーション状態の同期を行うフック
 * IPC経由で変更を受信し、Zustandストアを更新する
 */
export const useProjectSync = () => {
    useEffect(() => {
        const ipcService = getIPCService();

        // unitFactorの更新監視
        const unsubscribeUnitFactor = ipcService.onUnitFactorUpdated(
            (unitFactor) => {
                useAppStore.getState().syncUnitFactor(unitFactor);
            }
        );

        // unitの更新監視
        const unsubscribeUnit = ipcService.onUnitUpdated((unit) => {
            useAppStore.getState().syncUnit(unit);
        });

        // imageSetsの更新監視
        const unsubscribeImageSets = ipcService.onImageSetsUpdated(
            (imageSets) => {
                useAppStore.getState().syncImageSets(imageSets);
            }
        );

        // 初期状態同期要求の監視 (メインウィンドウが応答する側)
        const unsubscribeRequestSync = ipcService.onRequestStateSync(() => {
            // 現在の状態を送信
            const currentImageSets = useAppStore.getState().imageSets;
            const currentUnitFactor = useAppStore.getState().unitFactor;
            const currentUnit = useAppStore.getState().unit;

            ipcService.updateImageSets(currentImageSets);
            ipcService.updateUnitFactor(currentUnitFactor);
            ipcService.updateUnit(currentUnit);
        });

        return () => {
            unsubscribeUnitFactor();
            unsubscribeUnit();
            unsubscribeImageSets();
            unsubscribeRequestSync();
        };
    }, []);
};
