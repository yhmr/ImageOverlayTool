import { useCallback, useState } from "react";

import {
    normalizeWindowColor,
    normalizeWindowColorPresets,
} from "../../../shared/types/AppConfig";
import { useIpcService } from "../../providers/IpcServiceProvider";
import { useAppStore } from "../../store/useAppStore";

export interface WindowColorPickerController {
    isPickerOpen: boolean;
    setPickerOpen: (open: boolean) => void;
    open: () => void;
    windowColor: string;
    applyColor: (color: string, persist?: boolean) => void;
    presets: string[];
    addPreset: (color: string) => void;
    removePreset: (color: string) => void;
    updatePreset: (oldColor: string, newColor: string) => void;
}

const arePresetsEqual = (left: string[], right: string[]): boolean =>
    left.length === right.length &&
    left.every((preset, index) => preset === right[index]);

export function useWindowColorPickerController(): WindowColorPickerController {
    const ipcService = useIpcService();

    // 現在の背景色状態
    const windowColor = useAppStore((state) => state.windowColor);
    const setWindowColorStore = useAppStore((state) => state.setWindowColor);

    // プリセット状態
    const presets = useAppStore((state) => state.windowColorPresets);
    const setPresetsStore = useAppStore((state) => state.setWindowColorPresets);

    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const open = useCallback(() => setIsPickerOpen(true), []);

    // 選択された色を即座にアプリに適用＆保存する
    const applyColor = useCallback(
        (color: string, persist: boolean = true) => {
            const normalizedColor = normalizeWindowColor(color);
            setWindowColorStore(normalizedColor);
            if (persist) {
                void ipcService.saveWindowColor(normalizedColor);
            }
        },
        [ipcService, setWindowColorStore]
    );

    const savePresets = useCallback(
        (nextPresets: string[]) => {
            setPresetsStore(nextPresets);
            void ipcService.saveWindowColorPresets(nextPresets);
        },
        [ipcService, setPresetsStore]
    );

    // プリセットへの追加
    const addPreset = useCallback(
        (color: string) => {
            const nextPresets = normalizeWindowColorPresets([
                ...presets,
                color,
            ]);
            if (arePresetsEqual(presets, nextPresets)) {
                return;
            }
            savePresets(nextPresets);
        },
        [presets, savePresets]
    );

    // プリセットからの削除
    const removePreset = useCallback(
        (color: string) => {
            const nextPresets = normalizeWindowColorPresets(
                presets.filter((preset) => {
                    return preset.toLowerCase() !== color.toLowerCase();
                })
            );
            if (arePresetsEqual(presets, nextPresets)) {
                return;
            }
            savePresets(nextPresets);
        },
        [presets, savePresets]
    );

    const updatePreset = useCallback(
        (oldColor: string, newColor: string) => {
            const target = oldColor.toLowerCase();
            let hasTarget = false;
            const nextRawPresets = presets.map((preset) => {
                if (preset.toLowerCase() !== target) {
                    return preset;
                }
                hasTarget = true;
                return normalizeWindowColor(newColor);
            });

            if (!hasTarget) {
                return;
            }

            const nextPresets = normalizeWindowColorPresets(nextRawPresets);
            if (arePresetsEqual(presets, nextPresets)) {
                return;
            }
            savePresets(nextPresets);
        },
        [presets, savePresets]
    );

    return {
        isPickerOpen,
        setPickerOpen: setIsPickerOpen,
        open,
        windowColor,
        applyColor,
        presets,
        addPreset,
        removePreset,
        updatePreset,
    };
}
