import { useEffect } from "react";
import { useStore } from "zustand";
import type { TemporalState } from "zundo";
import { useAppStore, type AppState } from "../store/useAppStore";

export const useKeyboardShortcuts = () => {
    // zundo temporal store
    const { undo, redo } = useStore(
        useAppStore.temporal,
        (state: TemporalState<Partial<AppState>>) => ({
            undo: state.undo,
            redo: state.redo,
        })
    );

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
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
            }
            // Redo: Ctrl + Shift + Z or Ctrl + Y
            else if (
                (e.ctrlKey || e.metaKey) &&
                ((e.shiftKey && e.key.toLowerCase() === "z") ||
                    e.key.toLowerCase() === "y")
            ) {
                e.preventDefault();
                redo();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [undo, redo]);
};
