import { StateCreator } from "zustand";

import {
    DEFAULT_SHOW_WINDOW_FRAME,
    DEFAULT_WINDOW_COLOR_PRESETS,
    normalizeWindowColorPresets,
} from "../../../shared/types/AppConfig";

export interface AppConfigSlice {
    windowColorPresets: string[];
    setWindowColorPresets: (presets: string[]) => void;
    isWindowFrameVisible: boolean;
    setWindowFrameVisible: (visible: boolean) => void;
}

export const createAppConfigSlice: StateCreator<AppConfigSlice> = (set) => ({
    windowColorPresets: [...DEFAULT_WINDOW_COLOR_PRESETS],
    setWindowColorPresets: (presets) => {
        set({
            windowColorPresets: normalizeWindowColorPresets(presets),
        });
    },
    isWindowFrameVisible: DEFAULT_SHOW_WINDOW_FRAME,
    setWindowFrameVisible: (visible) => {
        set({
            isWindowFrameVisible: visible,
        });
    },
});
