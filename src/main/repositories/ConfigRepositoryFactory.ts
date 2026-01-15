import { app } from "electron";
import Store from "electron-store";
import { AppConfig } from "../../shared/types/AppConfig";
import { ConfigRepository, IConfigRepository } from "./ConfigRepository";
import { MockConfigRepository } from "./MockConfigRepository";

export enum RepositoryType {
  PRODUCTION = "production",
  MOCK = "mock",
}

export class ConfigRepositoryFactory {
  /**
   * Repositoryのインスタンスを生成して返す
   * @param type Repositoryの種類 (デフォルト: PRODUCTION)
   */
  static create(
    type: RepositoryType = RepositoryType.PRODUCTION
  ): IConfigRepository {
    switch (type) {
      case RepositoryType.MOCK:
        return new MockConfigRepository();
      case RepositoryType.PRODUCTION:
      default: {
        const store = new Store<AppConfig>({
          cwd: app.getPath("userData"), // 保存先のディレクトリ
          name: "app.config", // ファイル名
          fileExtension: "json", // 拡張子
        });

        return new ConfigRepository(store);
      }
    }
  }
}
