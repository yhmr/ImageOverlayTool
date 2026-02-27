import type { MainWindowShortcutLabelKey } from "../../hooks/shortcuts/mainWindowShortcuts";

export type Translate = (key: string) => string;
export type ShortcutLabel = (key: MainWindowShortcutLabelKey) => string;
