import { StateCreator } from "zustand";

import {
    DEFAULT_WINDOW_COLOR_PRESETS,
    normalizeWindowColorPresets,
} from "../../../shared/types/AppConfig";

export interface AppConfigSlice {
    windowColorPresets: string[];
    setWindowColorPresets: (presets: string[]) => void;
}

export const createAppConfigSlice: StateCreator<AppConfigSlice> = (set) => ({
    windowColorPresets: [...DEFAULT_WINDOW_COLOR_PRESETS],
    setWindowColorPresets: (presets) => {
        set({
            windowColorPresets: normalizeWindowColorPresets(presets),
        });
    },
});
