import { useCallback } from "react";

import { useCapture } from "../../hooks/useCapture";
import { useIpcService } from "../../providers/IpcServiceProvider";
import { useAppStore } from "../../store/useAppStore";

export interface MainWindowActions {
    isAlwaysOnTopMode: boolean;
    isClickThroughMode: boolean;
    canToggleClickThroughMode: boolean;
    openImageSettingsWindow: () => void;
    openDimensionSettingsWindow: () => void;
    captureBackground: () => void;
    toggleAlwaysOnTopMode: () => void;
    disableAlwaysOnTopMode: () => void;
    toggleClickThroughMode: () => void;
    disableClickThroughMode: () => void;
}

// メイン画面内で再利用する「操作コマンド」を集約する。
export function useMainWindowActions(): MainWindowActions {
    const ipcService = useIpcService();
    const { captureBackground } = useCapture();
    const isAlwaysOnTopMode = useAppStore((state) => state.isAlwaysOnTopMode);
    const isClickThroughMode = useAppStore((state) => state.isClickThroughMode);
    const setAlwaysOnTopMode = useAppStore((state) => state.setAlwaysOnTopMode);
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

    const toggleAlwaysOnTopMode = useCallback(() => {
        setAlwaysOnTopMode(!isAlwaysOnTopMode);
    }, [isAlwaysOnTopMode, setAlwaysOnTopMode]);

    const disableAlwaysOnTopMode = useCallback(() => {
        setAlwaysOnTopMode(false);
    }, [setAlwaysOnTopMode]);

    const toggleClickThroughMode = useCallback(() => {
        if (!isAlwaysOnTopMode) {
            return;
        }
        setClickThroughMode(!isClickThroughMode);
    }, [isAlwaysOnTopMode, isClickThroughMode, setClickThroughMode]);

    const disableClickThroughMode = useCallback(() => {
        setAlwaysOnTopMode(false);
    }, [setAlwaysOnTopMode]);

    return {
        isAlwaysOnTopMode,
        isClickThroughMode,
        canToggleClickThroughMode: isAlwaysOnTopMode,
        openImageSettingsWindow,
        openDimensionSettingsWindow,
        captureBackground: captureBackgroundAction,
        toggleAlwaysOnTopMode,
        disableAlwaysOnTopMode,
        toggleClickThroughMode,
        disableClickThroughMode,
    };
}
