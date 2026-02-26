import { useEffect, useRef } from "react";
import { useStore } from "zustand";
import type { TemporalState } from "zundo";

import { useFitToScreen } from "./useFitToScreen";
import {
    MAIN_WINDOW_SHORTCUT_BINDINGS,
    MAIN_WINDOW_SHORTCUT_LABELS,
    type MainWindowShortcutContext,
    type MainWindowShortcutLabelKey,
    type MainWindowShortcutOptions,
} from "./shortcuts/mainWindowShortcuts";
import { selectSetProjectDataChangeOrigin } from "../store/selectors";
import { useAppStore, type AppState } from "../store/useAppStore";

export { MAIN_WINDOW_SHORTCUT_LABELS, type MainWindowShortcutLabelKey };

export const useKeyboardShortcuts = (
    options: MainWindowShortcutOptions = {}
) => {
    const undo = useStore(
        useAppStore.temporal,
        (state: TemporalState<Partial<AppState>>) => state.undo
    );
    const redo = useStore(
        useAppStore.temporal,
        (state: TemporalState<Partial<AppState>>) => state.redo
    );
    const setProjectDataChangeOrigin = useAppStore(
        selectSetProjectDataChangeOrigin
    );
    const { fitToScreen } = useFitToScreen();
    const contextRef = useRef<MainWindowShortcutContext>({
        undo,
        redo,
        fitToScreen,
        setProjectDataChangeOrigin,
        options,
    });

    contextRef.current = {
        undo,
        redo,
        fitToScreen,
        setProjectDataChangeOrigin,
        options,
    };

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement;
            if (
                target.tagName === "INPUT" ||
                target.tagName === "TEXTAREA" ||
                target.isContentEditable
            ) {
                return;
            }

            for (const shortcutBinding of MAIN_WINDOW_SHORTCUT_BINDINGS) {
                if (!shortcutBinding.matches(event)) {
                    continue;
                }

                const handled = shortcutBinding.run(contextRef.current, event);
                if (handled) {
                    event.preventDefault();
                }
                return;
            }
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, []);
};
