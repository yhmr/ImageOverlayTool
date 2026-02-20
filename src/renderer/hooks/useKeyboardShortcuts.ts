import { useEffect } from "react";
import { useStore } from "zustand";
import type { TemporalState } from "zundo";
import { useFitToScreen } from "./useFitToScreen";
import { useAppStore, type AppState } from "../store/useAppStore";

export const MAIN_WINDOW_SHORTCUT_LABELS = {
    newProject: "Ctrl+N",
    openProject: "Ctrl+O",
    saveProject: "Ctrl+S",
    saveProjectAs: "Ctrl+Shift+S",
    openImageSettings: "Ctrl+I",
    fitToScreen: "Ctrl+F",
    pasteImage: "Ctrl+V",
    captureBackground: "Ctrl+Shift+C",
    exportImage: "Ctrl+E",
    openDimensionSettings: "Ctrl+D",
    openBackgroundStyle: "Ctrl+B",
    toggleAlwaysOnTopMode: "Ctrl+Shift+T",
    toggleClickThroughMode: "Ctrl+Shift+M",
    openSettings: "Ctrl+,",
    exportLogs: "Ctrl+Shift+L",
    exit: "Ctrl+Q",
} as const;
export type MainWindowShortcutLabelKey =
    keyof typeof MAIN_WINDOW_SHORTCUT_LABELS;

type KeyboardShortcutOptions = {
    onPasteImage?: () => Promise<void> | void;
    onNewProject?: () => Promise<void> | void;
    onOpenProject?: () => Promise<void> | void;
    onSaveProject?: () => Promise<void> | void;
    onSaveProjectAs?: () => Promise<void> | void;
    onOpenImageSettings?: () => Promise<void> | void;
    onCaptureBackground?: () => Promise<void> | void;
    onOpenImageExport?: () => Promise<void> | void;
    onOpenDimensionSettings?: () => Promise<void> | void;
    onOpenBackgroundStyle?: () => Promise<void> | void;
    onToggleClickThroughMode?: () => Promise<void> | void;
    onOpenSettings?: () => Promise<void> | void;
    onExportLogs?: () => Promise<void> | void;
    onExit?: () => Promise<void> | void;
};

export const useKeyboardShortcuts = (options: KeyboardShortcutOptions = {}) => {
    const {
        onPasteImage,
        onNewProject,
        onOpenProject,
        onSaveProject,
        onSaveProjectAs,
        onOpenImageSettings,
        onCaptureBackground,
        onOpenImageExport,
        onOpenDimensionSettings,
        onOpenBackgroundStyle,
        onToggleClickThroughMode,
        onOpenSettings,
        onExportLogs,
        onExit,
    } = options;

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
        const isCtrlOrMeta = (event: KeyboardEvent): boolean =>
            event.ctrlKey || event.metaKey;

        // NOTE: event.key.toLowerCase() はShift+アルファベットでは正しく動作するが、
        // Shift+記号キーでは event.key の値が変わる（例: Shift+"," → "<"）。
        // 将来 Shift+記号系のショートカットを追加する場合は event.code ベースへの変更を検討すること。
        const matchesShortcut = (
            event: KeyboardEvent,
            config: {
                key: string;
                shift?: boolean;
                alt?: boolean;
            }
        ): boolean =>
            isCtrlOrMeta(event) &&
            event.key.toLowerCase() === config.key &&
            event.shiftKey === (config.shift ?? false) &&
            event.altKey === (config.alt ?? false);

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
            if (matchesShortcut(e, { key: "z" })) {
                e.preventDefault();
                undo();
                // undo後のstateをsync bridgeが検出できるようにoriginをlocalに設定
                useAppStore.setState({ projectDataChangeOrigin: "local" });
            }
            // Redo: Ctrl + Shift + Z or Ctrl + Y
            else if (
                matchesShortcut(e, { key: "z", shift: true }) ||
                matchesShortcut(e, { key: "y" })
            ) {
                e.preventDefault();
                redo();
                useAppStore.setState({ projectDataChangeOrigin: "local" });
            }
            // New Project: Ctrl/Cmd + N
            else if (matchesShortcut(e, { key: "n" })) {
                if (!onNewProject) {
                    return;
                }
                e.preventDefault();
                void onNewProject();
            }
            // Open Project: Ctrl/Cmd + O
            else if (matchesShortcut(e, { key: "o" })) {
                if (!onOpenProject) {
                    return;
                }
                e.preventDefault();
                void onOpenProject();
            }
            // Save Project: Ctrl/Cmd + S
            else if (matchesShortcut(e, { key: "s" })) {
                if (!onSaveProject) {
                    return;
                }
                e.preventDefault();
                void onSaveProject();
            }
            // Save Project As: Ctrl/Cmd + Shift + S
            else if (matchesShortcut(e, { key: "s", shift: true })) {
                if (!onSaveProjectAs) {
                    return;
                }
                e.preventDefault();
                void onSaveProjectAs();
            }
            // Open Image Settings: Ctrl/Cmd + I
            else if (matchesShortcut(e, { key: "i" })) {
                if (!onOpenImageSettings) {
                    return;
                }
                e.preventDefault();
                void onOpenImageSettings();
            }
            // Paste Image: Ctrl/Cmd + V
            else if (matchesShortcut(e, { key: "v" })) {
                if (!onPasteImage) {
                    return;
                }
                e.preventDefault();
                void onPasteImage();
            }
            // Capture Background: Ctrl/Cmd + Shift + C
            else if (matchesShortcut(e, { key: "c", shift: true })) {
                if (!onCaptureBackground) {
                    return;
                }
                e.preventDefault();
                void onCaptureBackground();
            }
            // Export Image: Ctrl/Cmd + E
            else if (matchesShortcut(e, { key: "e" })) {
                if (!onOpenImageExport) {
                    return;
                }
                e.preventDefault();
                void onOpenImageExport();
            }
            // Open Dimension Settings: Ctrl/Cmd + D
            else if (matchesShortcut(e, { key: "d" })) {
                if (!onOpenDimensionSettings) {
                    return;
                }
                e.preventDefault();
                void onOpenDimensionSettings();
            }
            // Open Background Style: Ctrl/Cmd + B
            else if (matchesShortcut(e, { key: "b" })) {
                if (!onOpenBackgroundStyle) {
                    return;
                }
                e.preventDefault();
                void onOpenBackgroundStyle();
            }
            // Toggle Click-through Mode: Ctrl/Cmd + Shift + M
            else if (matchesShortcut(e, { key: "m", shift: true })) {
                if (!onToggleClickThroughMode) {
                    return;
                }
                e.preventDefault();
                void onToggleClickThroughMode();
            }
            // Open Settings: Ctrl/Cmd + ,
            else if (matchesShortcut(e, { key: "," })) {
                if (!onOpenSettings) {
                    return;
                }
                e.preventDefault();
                void onOpenSettings();
            }
            // Export Logs: Ctrl/Cmd + Shift + L
            else if (matchesShortcut(e, { key: "l", shift: true })) {
                if (!onExportLogs) {
                    return;
                }
                e.preventDefault();
                void onExportLogs();
            }
            // Fit to Screen: Ctrl/Cmd + F
            else if (matchesShortcut(e, { key: "f" })) {
                e.preventDefault();
                fitToScreen();
            }
            // Exit: Ctrl/Cmd + Q
            else if (matchesShortcut(e, { key: "q" })) {
                if (!onExit) {
                    return;
                }
                e.preventDefault();
                void onExit();
            }
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [
        fitToScreen,
        onCaptureBackground,
        onExit,
        onExportLogs,
        onNewProject,
        onOpenBackgroundStyle,
        onOpenDimensionSettings,
        onOpenImageExport,
        onOpenImageSettings,
        onOpenProject,
        onOpenSettings,
        onPasteImage,
        onSaveProject,
        onSaveProjectAs,
        onToggleClickThroughMode,
        redo,
        undo,
    ]);
};
