import Store from "electron-store";
import {
    AppConfig,
    normalizeWindowColor,
    normalizeWindowColorPresets,
} from "../../shared/types/AppConfig";

/**
 * 共有のelectron-storeインスタンス
 * 複数のリポジトリで同じ設定ファイルを使用する場合、
 * インスタンスを共有しないとlast-write-winsによるデータ損失が発生する
 */
let sharedStore: Store<AppConfig> | null = null;

export function getSharedStore(): Store<AppConfig> {
    if (!sharedStore) {
        sharedStore = new Store<AppConfig>();
        const color = normalizeWindowColor(sharedStore.get("window.color"));
        sharedStore.set("window.color", color);

        const presets = normalizeWindowColorPresets(
            sharedStore.get("window.colorPresets")
        );
        sharedStore.set("window.colorPresets", presets);
    }
    return sharedStore;
}
