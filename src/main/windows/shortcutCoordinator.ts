import type { IWindowShortcutManager } from "./windowShortcutManager";

/**
 * ショートカット登録処理を WindowManager から分離する薄いコーディネータ
 */
export class ShortcutCoordinator {
    constructor(private readonly shortcutManager: IWindowShortcutManager) {}

    /**
     * グローバルショートカットと通知コールバックを結びつける
     */
    register(options: {
        onAlwaysOnTopToggle: () => void;
        onClickThroughToggle: () => void;
    }): void {
        this.shortcutManager.registerToggleAlwaysOnTopMode(() => {
            options.onAlwaysOnTopToggle();
        });
        this.shortcutManager.registerToggleClickThroughMode(() => {
            options.onClickThroughToggle();
        });
    }

    /**
     * すべてのショートカット登録を解除
     */
    unregisterAll(): void {
        this.shortcutManager.unregisterAll();
    }
}
