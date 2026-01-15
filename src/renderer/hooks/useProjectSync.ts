import { useEffect } from "react";
import { useProjectStore } from "../store/useProjectStore";
import { useImageSetsStore } from "../store/useImageSetsStore";

/**
 * アプリケーション状態の同期を行うフック
 * IPC経由で変更を受信し、Zustandストアを更新する
 */
export const useProjectSync = () => {
  useEffect(() => {
    // unit_factorの更新監視
    const unsubscribeUnitFactor = window.electronAPI.onUnitFactorUpdated(
      (unitFactor) => {
        useProjectStore.getState().syncUnitFactor(unitFactor);
      }
    );

    // imageSetsの更新監視
    const unsubscribeImageSets = window.electronAPI.onImageSetsUpdated(
      (imageSets) => {
        useImageSetsStore.getState().syncImageSets(imageSets);
      }
    );

    // 初期状態同期要求の監視 (メインウィンドウが応答する側)
    const unsubscribeRequestSync = window.electronAPI.onRequestStateSync(() => {
      // 現在の状態を送信
      const currentImageSets = useImageSetsStore.getState().imageSets;
      const currentUnitFactor = useProjectStore.getState().unit_factor;

      window.electronAPI.updateImageSets(currentImageSets);
      window.electronAPI.updateUnitFactor(currentUnitFactor);
    });

    return () => {
      unsubscribeUnitFactor();
      unsubscribeImageSets();
      unsubscribeRequestSync();
    };
  }, []);
};
