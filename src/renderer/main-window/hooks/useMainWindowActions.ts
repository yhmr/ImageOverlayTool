import { useCallback } from "react";

import { useCapture } from "../../hooks/useCapture";
import { useIpcService } from "../../providers/IpcServiceProvider";
import { useAppStore } from "../../store/useAppStore";

export interface MainWindowActions {
    isClickThroughMode: boolean;
    openImageSettingsWindow: () => void;
    openDimensionSettingsWindow: () => void;
    captureBackground: () => void;
    toggleClickThroughMode: () => void;
    disableClickThroughMode: () => void;
}

// メイン画面内で再利用する「操作コマンド」を集約する。
export function useMainWindowActions(): MainWindowActions {
    const ipcService = useIpcService();
    const { captureBackground } = useCapture();
    const isClickThroughMode = useAppStore((state) => state.isClickThroughMode);
    const setClickThroughMode = useAppStore(
        (state) => state.setClickThroughMode
    );

    const openImageSettingsWindow = useCallback(() => {
        void ipcService.toggleImageSettingsWindow();
    }, [ipcService]);

    const openDimensionSettingsWindow = useCallback(() => {
        void ipcService.toggleDimensionSettingsWindow();
    }, [ipcService]);

    const captureBackgroundAction = useCallback(() => {
        void captureBackground();
    }, [captureBackground]);

    const toggleClickThroughMode = useCallback(() => {
        setClickThroughMode(!isClickThroughMode);
    }, [isClickThroughMode, setClickThroughMode]);

    const disableClickThroughMode = useCallback(() => {
        setClickThroughMode(false);
    }, [setClickThroughMode]);

    return {
        isClickThroughMode,
        openImageSettingsWindow,
        openDimensionSettingsWindow,
        captureBackground: captureBackgroundAction,
        toggleClickThroughMode,
        disableClickThroughMode,
    };
}
