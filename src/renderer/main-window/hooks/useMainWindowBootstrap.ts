import { useEffect, useLayoutEffect } from "react";

import { DEFAULT_SHOW_WINDOW_FRAME } from "../../../shared/types/AppConfig";
import { useIpcService } from "../../providers/IpcServiceProvider";
import {
    selectHasUnsavedChanges,
    selectSetWindowColor,
    selectSetWindowColorPresets,
    selectSetWindowFrameVisible,
} from "../../store/selectors";
import { useAppStore } from "../../store/useAppStore";

export const useMainWindowBootstrap = (): void => {
    const ipcService = useIpcService();
    const hasUnsavedChanges = useAppStore(selectHasUnsavedChanges);
    const setWindowColor = useAppStore(selectSetWindowColor);
    const setWindowColorPresets = useAppStore(selectSetWindowColorPresets);
    const setWindowFrameVisible = useAppStore(selectSetWindowFrameVisible);

    useLayoutEffect(() => {
        const loadSetting = async () => {
            const [color, presets, setting] = await Promise.all([
                ipcService.loadWindowColor(),
                ipcService.loadWindowColorPresets(),
                ipcService.loadSetting(),
            ]);

            setWindowColor(color);
            setWindowColorPresets(presets);
            setWindowFrameVisible(
                setting.showWindowFrame ?? DEFAULT_SHOW_WINDOW_FRAME
            );

            useAppStore.temporal.getState().clear();
            useAppStore.getState().markProjectSaved();
        };

        void loadSetting();
    }, [
        ipcService,
        setWindowColor,
        setWindowColorPresets,
        setWindowFrameVisible,
    ]);

    useEffect(() => {
        void ipcService.updateProjectDirty(hasUnsavedChanges);
    }, [hasUnsavedChanges, ipcService]);
};
