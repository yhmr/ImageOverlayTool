import { useEffect } from "react";

import { useIpcService } from "../providers/IpcServiceProvider";
import {
    createSyncBroadcaster,
    toProjectSyncSnapshot,
} from "../services/sync/syncBroadcaster";
import { useAppStore } from "../store/useAppStore";

/**
 * 他のウィンドウ（新しく開いた設定画面など）からの同期要求（onRequestStateSync）を待ち受け、
 * 要求が来た際に現在のZustand Storeの全データ（スナップショット）を返信するフック。
 *
 * 主にメインウィンドウなど、データを常に正しく保持している側のコンポーネントで呼び出される。
 */
export const useRespondProjectDataSyncRequest = () => {
    const ipcService = useIpcService();

    useEffect(() => {
        const broadcaster = createSyncBroadcaster(ipcService);

        const unsubscribeRequestSync = ipcService.onRequestStateSync(() => {
            // 現在のStoreの全データをスナップショットとして取り出し、要求元へブロードキャストする
            const snapshot = toProjectSyncSnapshot(useAppStore.getState());
            broadcaster.broadcastSnapshot(snapshot);
        });

        return () => {
            unsubscribeRequestSync();
        };
    }, [ipcService]);
};
