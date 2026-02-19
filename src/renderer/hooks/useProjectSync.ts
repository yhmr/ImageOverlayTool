import { useEffect } from "react";

import { useIpcService } from "../providers/IpcServiceProvider";
import { useAppStore } from "../store/useAppStore";

/**
 * アプリケーション状態の同期を行うフック
 * IPC経由で変更を受信し、Zustandストアを更新する
 */
export const useProjectSync = () => {
    const ipcService = useIpcService();

    useEffect(() => {
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

        // imageSetsの更新監視（undo対象とするためreceiveImageSetsを使用）
        const unsubscribeImageSets = ipcService.onImageSetsUpdated(
            (imageSets) => {
                useAppStore.getState().receiveImageSets(imageSets);
            }
        );

        const unsubscribeDimensionLines = ipcService.onDimensionLinesUpdated(
            (dimensionLines) => {
                useAppStore.getState().receiveDimensionLines(dimensionLines);
            }
        );

        // selectedImageIdの更新監視
        // 寸法線操作中はリモートからの選択変更を無視する
        // （setSelectedImageIdがselectedDimensionLineIdをクリアするため）
        const unsubscribeSelectedImageId = ipcService.onSelectedImageIdUpdated(
            (id) => {
                const { interactionMode } = useAppStore.getState();
                if (interactionMode === "default") {
                    useAppStore.getState().setSelectedImageId(id);
                }
            }
        );

        const unsubscribeSelectedDimensionLineId =
            ipcService.onSelectedDimensionLineIdUpdated((id) => {
                useAppStore.getState().setSelectedDimensionLineId(id);
            });

        const unsubscribeInteractionMode = ipcService.onInteractionModeUpdated(
            (mode) => {
                useAppStore.getState().setInteractionMode(mode);
            }
        );

        // 初期状態同期要求の監視 (メインウィンドウが応答する側)
        const unsubscribeRequestSync = ipcService.onRequestStateSync(() => {
            // 現在の状態を送信
            const currentImageSets = useAppStore.getState().imageSets;
            const currentDimensionLines = useAppStore.getState().dimensionLines;
            const currentUnitFactor = useAppStore.getState().unitFactor;
            const currentUnit = useAppStore.getState().unit;
            const currentInteractionMode =
                useAppStore.getState().interactionMode;
            const currentSelectedImageId =
                useAppStore.getState().selectedImageId;
            const currentSelectedDimensionLineId =
                useAppStore.getState().selectedDimensionLineId;

            ipcService.updateImageSets(currentImageSets);
            ipcService.updateDimensionLines(currentDimensionLines);
            ipcService.updateUnitFactor(currentUnitFactor);
            ipcService.updateUnit(currentUnit);
            ipcService.updateInteractionMode(currentInteractionMode);
            ipcService.updateSelectedImageId(currentSelectedImageId);
            ipcService.updateSelectedDimensionLineId(
                currentSelectedDimensionLineId
            );
        });

        return () => {
            unsubscribeUnitFactor();
            unsubscribeUnit();
            unsubscribeImageSets();
            unsubscribeDimensionLines();
            unsubscribeSelectedImageId();
            unsubscribeSelectedDimensionLineId();
            unsubscribeInteractionMode();
            unsubscribeRequestSync();
        };
    }, [ipcService]);
};
