import Store from "electron-store";
import { AppConfig } from "../../shared/types/AppConfig";

/**
 * 共有のelectron-storeインスタンス
 * 複数のリポジトリで同じ設定ファイルを使用する場合、
 * インスタンスを共有しないとlast-write-winsによるデータ損失が発生する
 */
let sharedStore: Store<AppConfig> | null = null;

export function getSharedStore(): Store<AppConfig> {
    if (!sharedStore) {
        sharedStore = new Store<AppConfig>();
    }
    return sharedStore;
}
