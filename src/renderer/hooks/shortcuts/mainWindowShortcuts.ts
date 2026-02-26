import type { ProjectDataChangeOrigin } from "../../store/slices/createSyncOriginSlice";
import {
    getPresetColorIndex,
    matchesPresetColorShortcut,
    matchesShortcut,
    type ShortcutKeyConfig,
} from "./shortcutMatcher";

type OptionalShortcutHandler = (() => Promise<void> | void) | undefined;

/**
 * メインウィンドウにおけるショートカットハンドラのインターフェース。
 * （各機能の実際の処理は `useMainWindowActions` などから渡される）
 */
export interface MainWindowShortcutOptions {
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
    onToggleWindowFrame?: () => Promise<void> | void;
    onOpenSettings?: () => Promise<void> | void;
    onExportLogs?: () => Promise<void> | void;
    onExit?: () => Promise<void> | void;
    onApplyPresetColor?: (index: number) => Promise<void> | void;
}

/**
 * ショートカット実行時にハンドラへ渡されるコンテキスト情報。
 * Zustand Storeから連携される関数や、フック（useKeyboardShortcuts）へ
 * 直接渡されたオプション関数などが含まれる。
 */
export interface MainWindowShortcutContext {
    undo: () => void;
    redo: () => void;
    fitToScreen: () => void;
    setProjectDataChangeOrigin: (origin: ProjectDataChangeOrigin) => void;
    options: MainWindowShortcutOptions;
}

type OptionalShortcutKey = Exclude<
    keyof MainWindowShortcutOptions,
    "onApplyPresetColor"
>;

/**
 * 単独のキーボードショートカットの「判定条件」と「実行される処理」を定義するオブジェクト。
 */
interface ShortcutBinding {
    matches: (event: KeyboardEvent) => boolean;
    // 処理が実行された（ハンドラが存在し処理を行った）場合は true を返す（event.preventDefault() 用）
    run: (context: MainWindowShortcutContext, event: KeyboardEvent) => boolean;
}

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
    toggleWindowFrame: "Ctrl+Shift+R",
    openSettings: "Ctrl+,",
    exportLogs: "Ctrl+Shift+L",
    exit: "Ctrl+Q",
} as const;

export type MainWindowShortcutLabelKey =
    keyof typeof MAIN_WINDOW_SHORTCUT_LABELS;

const invokeOptionalShortcut = (handler: OptionalShortcutHandler): boolean => {
    if (!handler) {
        return false;
    }

    void handler();
    return true;
};

/**
 * オプション引数として渡されるショートカット用関数群（MainWindowShortcutOptions）を、
 * 短い記述で一括して Binding 配列に登録するためのヘルパー関数。
 */
const createOptionalShortcutBinding = (
    config: ShortcutKeyConfig,
    optionKey: OptionalShortcutKey
): ShortcutBinding => ({
    matches: (event) => matchesShortcut(event, config),
    run: ({ options }) => invokeOptionalShortcut(options[optionKey]),
});

/**
 * メインウィンドウで有効な全てのショートカットパターンのリスト。
 * キーボードイベント発生時、このリストを上から順に走査して最初に一致する処理を実行する。
 */
export const MAIN_WINDOW_SHORTCUT_BINDINGS: ShortcutBinding[] = [
    {
        matches: (event) => matchesShortcut(event, { key: "z" }),
        run: ({ undo, setProjectDataChangeOrigin }) => {
            undo();
            setProjectDataChangeOrigin("local");
            return true;
        },
    },
    {
        matches: (event) =>
            matchesShortcut(event, { key: "z", shift: true }) ||
            matchesShortcut(event, { key: "y" }),
        run: ({ redo, setProjectDataChangeOrigin }) => {
            redo();
            setProjectDataChangeOrigin("local");
            return true;
        },
    },
    createOptionalShortcutBinding({ key: "n" }, "onNewProject"),
    createOptionalShortcutBinding({ key: "o" }, "onOpenProject"),
    createOptionalShortcutBinding({ key: "s" }, "onSaveProject"),
    createOptionalShortcutBinding({ key: "s", shift: true }, "onSaveProjectAs"),
    createOptionalShortcutBinding({ key: "i" }, "onOpenImageSettings"),
    createOptionalShortcutBinding({ key: "v" }, "onPasteImage"),
    createOptionalShortcutBinding(
        { key: "c", shift: true },
        "onCaptureBackground"
    ),
    createOptionalShortcutBinding({ key: "e" }, "onOpenImageExport"),
    createOptionalShortcutBinding({ key: "d" }, "onOpenDimensionSettings"),
    createOptionalShortcutBinding({ key: "b" }, "onOpenBackgroundStyle"),
    createOptionalShortcutBinding(
        { key: "m", shift: true },
        "onToggleClickThroughMode"
    ),
    createOptionalShortcutBinding(
        { key: "r", shift: true },
        "onToggleWindowFrame"
    ),
    createOptionalShortcutBinding({ key: "," }, "onOpenSettings"),
    createOptionalShortcutBinding({ key: "l", shift: true }, "onExportLogs"),
    {
        matches: (event) => matchesShortcut(event, { key: "f" }),
        run: ({ fitToScreen }) => {
            fitToScreen();
            return true;
        },
    },
    createOptionalShortcutBinding({ key: "q" }, "onExit"),
    {
        matches: (event) => matchesPresetColorShortcut(event),
        run: ({ options }, event) => {
            if (!options.onApplyPresetColor) {
                return false;
            }

            const index = getPresetColorIndex(event);
            if (index === null) {
                return false;
            }

            void options.onApplyPresetColor(index);
            return true;
        },
    },
];
