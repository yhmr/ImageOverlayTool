import { useCallback } from "react";

import { useCapture } from "../../hooks/useCapture";
import { useIpcService } from "../../providers/IpcServiceProvider";
import {
    selectIsAlwaysOnTopMode,
    selectIsClickThroughMode,
    selectIsWindowFrameVisible,
    selectSetAlwaysOnTopMode,
    selectSetClickThroughMode,
    selectSetWindowFrameVisible,
} from "../../store/selectors";
import { useAppStore } from "../../store/useAppStore";

export interface MainWindowActions {
    isAlwaysOnTopMode: boolean;
    isClickThroughMode: boolean;
    canToggleClickThroughMode: boolean;
    isWindowFrameVisible: boolean;
    openImageSettingsWindow: () => void;
    openDimensionSettingsWindow: () => void;
    captureBackground: () => void;
    toggleAlwaysOnTopMode: () => void;
    disableAlwaysOnTopMode: () => void;
    toggleClickThroughMode: () => void;
    disableClickThroughMode: () => void;
    toggleWindowFrameVisibility: () => void;
}

// メイン画面内で再利用する「操作コマンド」を集約する。
export function useMainWindowActions(): MainWindowActions {
    const ipcService = useIpcService();
    const { captureBackground } = useCapture();
    const isAlwaysOnTopMode = useAppStore(selectIsAlwaysOnTopMode);
    const isClickThroughMode = useAppStore(selectIsClickThroughMode);
    const isWindowFrameVisible = useAppStore(selectIsWindowFrameVisible);
    const setAlwaysOnTopMode = useAppStore(selectSetAlwaysOnTopMode);
    const setClickThroughMode = useAppStore(selectSetClickThroughMode);
    const setWindowFrameVisible = useAppStore(selectSetWindowFrameVisible);

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

    const toggleWindowFrameVisibility = useCallback(() => {
        const nextVisible = !isWindowFrameVisible;
        setWindowFrameVisible(nextVisible);

        const persist = async () => {
            const setting = await ipcService.loadSetting();
            await ipcService.saveSetting({
                ...setting,
                showWindowFrame: nextVisible,
            });
        };

        void persist().catch((error) => {
            void ipcService.log.warn("Failed to persist window frame setting", {
                error,
                showWindowFrame: nextVisible,
            });
        });
    }, [isWindowFrameVisible, setWindowFrameVisible, ipcService]);

    return {
        isAlwaysOnTopMode,
        isClickThroughMode,
        canToggleClickThroughMode: isAlwaysOnTopMode,
        isWindowFrameVisible,
        openImageSettingsWindow,
        openDimensionSettingsWindow,
        captureBackground: captureBackgroundAction,
        toggleAlwaysOnTopMode,
        disableAlwaysOnTopMode,
        toggleClickThroughMode,
        disableClickThroughMode,
        toggleWindowFrameVisibility,
    };
}
