/**
 * ショートカットキーの組み合わせを定義する設定情報。
 *
 * @property key - 判定ターゲットとなるキー（例: 'z', 'n', '1' など）
 * @property shift - Shiftキーを同時に押す必要があるか
 * @property alt - Alt/Optionキーを同時に押す必要があるか
 */
export interface ShortcutKeyConfig {
    key: string;
    shift?: boolean;
    alt?: boolean;
}

/**
 * OSごとの修飾キーの違いを吸収し、Windows/LinuxではCtrl、MacではCmdキーが
 * 押されているかを判定する。
 */
export const isCtrlOrMetaPressed = (event: KeyboardEvent): boolean =>
    event.ctrlKey || event.metaKey;

/**
 * 発生したキーボードイベントが、指定されたショートカット設定（ShortcutKeyConfig）と
 * 完全に一致するかどうかを判定する。
 * （大文字小文字の違いを吸収するため `.toLowerCase()` で比較）
 */
export const matchesShortcut = (
    event: KeyboardEvent,
    config: ShortcutKeyConfig
): boolean =>
    isCtrlOrMetaPressed(event) &&
    event.key.toLowerCase() === config.key &&
    event.shiftKey === (config.shift ?? false) &&
    event.altKey === (config.alt ?? false);

export const matchesPresetColorShortcut = (event: KeyboardEvent): boolean =>
    isCtrlOrMetaPressed(event) &&
    event.altKey &&
    !event.shiftKey &&
    /^[1-9]$/.test(event.key);

export const getPresetColorIndex = (event: KeyboardEvent): number | null => {
    if (!matchesPresetColorShortcut(event)) {
        return null;
    }

    return parseInt(event.key, 10) - 1;
};
