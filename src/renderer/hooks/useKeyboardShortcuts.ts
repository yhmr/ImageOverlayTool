import { useEffect } from "react";
import { useStore } from "zustand";
import type { TemporalState } from "zundo";
import { useFitToScreen } from "./useFitToScreen";
import { useAppStore, type AppState } from "../store/useAppStore";

export const useKeyboardShortcuts = () => {
    // zundo temporal store
    const undo = useStore(
        useAppStore.temporal,
        (state: TemporalState<Partial<AppState>>) => state.undo
    );
    const redo = useStore(
        useAppStore.temporal,
        (state: TemporalState<Partial<AppState>>) => state.redo
    );
    const { fitToScreen } = useFitToScreen();

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            // 入力要素にフォーカスがある場合は無視（ネイティブのUndo/Redoを優先）
            const target = e.target as HTMLElement;
            if (
                target.tagName === "INPUT" ||
                target.tagName === "TEXTAREA" ||
                target.isContentEditable
            ) {
                return;
            }

            // Undo: Ctrl + Z
            if (
                (e.ctrlKey || e.metaKey) &&
                !e.shiftKey &&
                e.key.toLowerCase() === "z"
            ) {
                e.preventDefault();
                undo();
                // undo後のstateをsync bridgeが検出できるようにoriginをlocalに設定
                useAppStore.setState({ projectDataChangeOrigin: "local" });
            }
            // Redo: Ctrl + Shift + Z or Ctrl + Y
            else if (
                (e.ctrlKey || e.metaKey) &&
                ((e.shiftKey && e.key.toLowerCase() === "z") ||
                    e.key.toLowerCase() === "y")
            ) {
                e.preventDefault();
                redo();
                useAppStore.setState({ projectDataChangeOrigin: "local" });
            }
            // Fit to Screen: Ctrl/Cmd + F
            else if (
                (e.ctrlKey || e.metaKey) &&
                !e.shiftKey &&
                !e.altKey &&
                e.key.toLowerCase() === "f"
            ) {
                e.preventDefault();
                fitToScreen();
            }
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [fitToScreen, redo, undo]);
};
